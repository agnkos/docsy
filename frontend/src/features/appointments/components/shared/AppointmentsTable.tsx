import {
  columnSizingFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import type { ColumnDef, OnChangeFn, SortingState } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Center, Group, ScrollArea, Select, Table, Text, UnstyledButton } from '@mantine/core'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { conductedOptions, isConductedFilter } from '../../conductedFilter'
import type { ConductedFilter } from '../../conductedFilter'
import type { AppointmentDetail } from '../../types'
import { formatShortDate } from '../../../../utils/helpers'
import { paths } from '../../../../app/paths'
import ButtonLink from '../../../../components/ui/ButtonLink'
import { useState } from 'react'
import classes from './AppointmentsTable.module.css'

type AppointmentsTableProps = {
  items: AppointmentDetail[]
  total: number
  isAdmin: boolean
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  conducted: ConductedFilter
  onConductedChange: (value: ConductedFilter) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

const features = tableFeatures({ rowSortingFeature, columnSizingFeature })

type AppointmentColumn = ColumnDef<typeof features, AppointmentDetail>

const textCell: AppointmentColumn['cell'] = (info) => <p>{info.getValue<string>()}</p>

const patientColumns: AppointmentColumn[] = [
  {
    id: 'patientFirstName',
    accessorFn: (row) => row.patient.user.firstName,
    header: 'Patient first name',
    cell: textCell,
  },
  {
    id: 'patientLastName',
    accessorFn: (row) => row.patient.user.lastName,
    header: 'Patient last name',
    cell: textCell,
  },
]

const doctorColumns: AppointmentColumn[] = [
  {
    id: 'doctorFirstName',
    accessorFn: (row) => row.slot.doctor.user.firstName,
    header: 'Doctor first name',
    cell: textCell,
  },
  {
    id: 'doctorLastName',
    accessorFn: (row) => row.slot.doctor.user.lastName,
    header: 'Doctor last name',
    cell: textCell,
  },
]

const detailColumns: AppointmentColumn[] = [
  {
    id: 'date',
    accessorFn: (row) => row.slot.date,
    header: 'Date',
    cell: (info) => <p>{formatShortDate(info.getValue<string>())}</p>,
  },
  {
    id: 'conducted',
    accessorFn: (row) => row.conducted,
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const { cancelled, conducted } = row.original
      if (cancelled) return <p>Cancelled</p>
      return <p>{conducted ? 'Conducted' : 'Not conducted'}</p>
    },
  },
  {
    id: 'address',
    accessorFn: (row) => row.slot.address,
    header: 'Address',
    enableSorting: false,
    cell: textCell,
  },
  {
    id: 'edit',
    header: 'Edit',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.cancelled ? null : (
        <ButtonLink
          size='compact-md'
          px={14}
          fw={500}
          to={paths.APPOINTMENT}
          params={{ appointmentId: row.original.id }}
          state={{ fromTable: true }}
        >
          Edit
        </ButtonLink>
      ),
  },
]

const staffColumns = [...patientColumns, ...detailColumns]
const adminColumns = [...patientColumns, ...doctorColumns, ...detailColumns]

const ariaSortValues = { asc: 'ascending', desc: 'descending' } as const

const ROW_HEIGHT = 55

const AppointmentsTable = ({
  items,
  total,
  isAdmin,
  sorting,
  onSortingChange,
  conducted,
  onConductedChange,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: AppointmentsTableProps) => {
  const columns = isAdmin ? adminColumns : staffColumns
  const table = useTable({
    key: 'appointments-table',
    features,
    columns,
    data: items,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
  })
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollParent,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const rows = table.getRowModel().rows

  const handleBottomReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }

  return (
    <>
      <ScrollArea.Autosize
        mah='calc(100vh - 260px)'
        type='hover'
        onBottomReached={handleBottomReached}
        viewportRef={setScrollParent}
      >
        <Table
          highlightOnHover
          withColumnBorders
          withRowBorders
          withTableBorder
          bg='white'
          verticalSpacing='sm'
          stickyHeader
          stickyHeaderOffset={0}
          w='100%'
          miw={800}
        >
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortDirection = header.column.getIsSorted()
                  const SortIcon =
                    sortDirection === 'asc'
                      ? ArrowUp
                      : sortDirection === 'desc'
                        ? ArrowDown
                        : ArrowUpDown

                  return (
                    <Table.Th
                      key={header.id}
                      // w={header.column.columnDef.size}
                      aria-sort={sortDirection ? ariaSortValues[sortDirection] : undefined}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <UnstyledButton
                          onClick={header.column.getToggleSortingHandler()}
                          fw='inherit'
                        >
                          <Group gap={6} wrap='nowrap'>
                            <table.FlexRender header={header} />
                            <SortIcon size={14} opacity={sortDirection ? 1 : 0.45} />
                          </Group>
                        </UnstyledButton>
                      ) : header.column.id === 'conducted' ? (
                        <Select
                          aria-label='Filter by status'
                          size='xs'
                          data={conductedOptions}
                          value={conducted}
                          onChange={(value) => {
                            if (isConductedFilter(value)) onConductedChange(value)
                          }}
                          allowDeselect={false}
                          w={150}
                        />
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </Table.Th>
                  )
                })}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <Center py='xl'>No appointments found.</Center>
                </Table.Td>
              </Table.Tr>
            ) : (
              <>
                {virtualItems.length > 0 && (
                  <tr aria-hidden>
                    <td
                      aria-hidden
                      colSpan={columns.length}
                      style={{ height: virtualItems[0].start, padding: 0, border: 'none' }}
                    />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <Table.Tr
                      key={row.id}
                      className={classes.row}
                      data-odd={virtualRow.index % 2 === 1 || undefined}
                    >
                      {row.getAllCells().map((cell) => (
                        <Table.Td key={cell.id}>
                          <table.FlexRender cell={cell} />
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  )
                })}
                {virtualItems.length > 0 && (
                  <tr aria-hidden>
                    <td
                      aria-hidden
                      colSpan={columns.length}
                      style={{
                        height:
                          virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end,
                        padding: 0,
                        border: 'none',
                      }}
                    />
                  </tr>
                )}
              </>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea.Autosize>
      <Text size='sm' c='dimmed'>
        Showing {items.length} of {total}
      </Text>
    </>
  )
}

export default AppointmentsTable
