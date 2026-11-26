import { useEffect, useState } from 'react'
import {
  columnSizingFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import type { ColumnDef, OnChangeFn, SortingState } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Center, Group, ScrollArea, Select, Table, Text, UnstyledButton } from '@mantine/core'
import type { DatesRangeValue } from '@mantine/dates'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { conductedOptions, isConductedFilter } from '../../conductedFilter'
import type { ConductedFilter } from '../../conductedFilter'
import type { AppointmentDetail } from '../../types'
import { formatShortDate } from '../../../../utils/helpers'
import { paths } from '../../../../app/paths'
import ButtonLink from '../../../../components/ui/ButtonLink'
import { DateFilter } from './AppointmentsTableComponents'

import classes from './AppointmentsTable.module.css'

type AppointmentsTableProps = {
  items: AppointmentDetail[]
  total: number
  isAdmin: boolean
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  conducted: ConductedFilter
  onConductedChange: (value: ConductedFilter) => void
  date: DatesRangeValue<string>
  onDateChange: (date: DatesRangeValue<string>) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

const features = tableFeatures({ rowSortingFeature, columnSizingFeature })

type AppointmentColumn = ColumnDef<typeof features, AppointmentDetail>

const textCell: AppointmentColumn['cell'] = (info) => {
  const value = info.getValue<string>()
  return <p title={value}>{value}</p>
}

const patientColumns: AppointmentColumn[] = [
  {
    id: 'patientFirstName',
    accessorFn: (row) => row.patient.user.firstName,
    header: 'Patient first name',
    size: 150,
    cell: textCell,
  },
  {
    id: 'patientLastName',
    accessorFn: (row) => row.patient.user.lastName,
    header: 'Patient last name',
    size: 150,
    cell: textCell,
  },
]

const doctorColumns: AppointmentColumn[] = [
  {
    id: 'doctorFirstName',
    accessorFn: (row) => row.slot.doctor.user.firstName,
    header: 'Doctor first name',
    size: 150,
    cell: textCell,
  },
  {
    id: 'doctorLastName',
    accessorFn: (row) => row.slot.doctor.user.lastName,
    header: 'Doctor last name',
    size: 150,
    cell: textCell,
  },
]

const detailColumns: AppointmentColumn[] = [
  {
    id: 'date',
    accessorFn: (row) => row.slot.date,
    header: 'Date',
    size: 100,
    cell: (info) => <p>{formatShortDate(info.getValue<string>())}</p>,
  },
  {
    id: 'conducted',
    accessorFn: (row) => row.conducted,
    header: 'Status',
    size: 180,
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
    size: 200,
    enableSorting: false,
    cell: textCell,
  },
  {
    id: 'edit',
    header: 'Edit',
    size: 100,
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

const ROW_HEIGHT = 51

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
  date,
  onDateChange,
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
    overscan: 5,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const rows = table.getRowModel().rows

  // State-based instead of ScrollArea's onBottomReached, which only fires on a scroll transition
  // and is missed when the list changes while the viewport is already at the bottom
  const lastVisibleIndex = virtualItems.at(-1)?.index
  useEffect(() => {
    if (lastVisibleIndex === undefined) return
    if (lastVisibleIndex >= items.length - 1 && hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [lastVisibleIndex, items.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <>
      <ScrollArea.Autosize
        mah='calc(100vh - 260px)'
        type='hover'
        viewportRef={setScrollParent}
        classNames={{ scrollbar: classes.scrollbar, viewport: classes.viewport }}
      >
        <Table
          className={classes.table}
          layout='fixed'
          highlightOnHover
          withColumnBorders
          withRowBorders
          withTableBorder
          bg='white'
          verticalSpacing='sm'
          stickyHeader
          stickyHeaderOffset={0}
          w='100%'
          miw={table.getTotalSize()}
        >
          <colgroup>
            {columns.map((column) => (
              <col key={column.id} style={{ width: column.size }} />
            ))}
          </colgroup>
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
                      aria-sort={sortDirection ? ariaSortValues[sortDirection] : undefined}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <Group gap={4} wrap='nowrap'>
                          <UnstyledButton
                            onClick={header.column.getToggleSortingHandler()}
                            fw='inherit'
                          >
                            <Group gap={6} wrap='nowrap'>
                              <table.FlexRender header={header} />
                              <SortIcon size={14} opacity={sortDirection ? 1 : 0.45} />
                            </Group>
                          </UnstyledButton>
                          {header.column.id === 'date' && (
                            <DateFilter value={date} onChange={onDateChange} />
                          )}
                        </Group>
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
