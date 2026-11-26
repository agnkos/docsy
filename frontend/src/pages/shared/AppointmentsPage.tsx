import { Checkbox, CloseButton, Group, Stack, Text, TextInput } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { Search } from 'lucide-react'

import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import AppointmentsTable from '../../features/appointments/components/shared/AppointmentsTable'
import { useInfiniteAppointments } from '../../features/appointments/hooks/useInfiniteAppointments'
import { conductedParams } from '../../features/appointments/conductedFilter'
import { toSortParams } from '../../features/appointments/sorting'
import { palette } from '../../styles/colors'
import { useAppointmentsFilterStore } from '../../stores/appointmentsFilterStore'
import { useAuthStore } from '../../stores/authStore'

const SEARCH_DEBOUNCE_MS = 300

const AppointmentsPage = () => {
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN')
  const {
    patientSearch,
    setPatientSearch,
    doctorSearch,
    setDoctorSearch,
    showCancelled,
    setShowCancelled,
    conducted,
    setConducted,
    sorting,
    setSorting,
    date,
    setDate,
  } = useAppointmentsFilterStore()
  const [debouncedPatientSearch] = useDebouncedValue(patientSearch, SEARCH_DEBOUNCE_MS)
  const [debouncedDoctorSearch] = useDebouncedValue(doctorSearch, SEARCH_DEBOUNCE_MS)

  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteAppointments({
      patient: debouncedPatientSearch.trim() || undefined,
      doctor: isAdmin ? debouncedDoctorSearch.trim() || undefined : undefined,
      cancelled: isAdmin && !showCancelled ? false : undefined,
      conducted: conductedParams[conducted],
      ...toSortParams(sorting),
    })

  return (
    <Stack flex={1} mih={0}>
      <Group align='flex-end' justify='space-between'>
        <Group align='flex-end'>
          <TextInput
            label='Patient'
            value={patientSearch}
            onChange={(event) => setPatientSearch(event.currentTarget.value)}
            placeholder='Search by patient name...'
            leftSection={<Search size={16} />}
            rightSection={
              patientSearch ? <CloseButton size={16} onClick={() => setPatientSearch('')} /> : null
            }
            rightSectionPointerEvents='all'
            w={{ base: '100%', sm: 300 }}
          />
          {isAdmin && (
            <TextInput
              label='Doctor'
              value={doctorSearch}
              onChange={(event) => setDoctorSearch(event.currentTarget.value)}
              placeholder='Search by doctor name...'
              leftSection={<Search size={16} />}
              rightSection={
                doctorSearch ? <CloseButton size={16} onClick={() => setDoctorSearch('')} /> : null
              }
              rightSectionPointerEvents='all'
              w={{ base: '100%', sm: 300 }}
            />
          )}
        </Group>
        {isAdmin && (
          <Checkbox
            label='Show cancelled'
            checked={showCancelled}
            onChange={(event) => setShowCancelled(event.currentTarget.checked)}
            mb={8}
          />
        )}
      </Group>
      {isPending ? (
        <LoadingSpinner />
      ) : isError ? (
        <Text c={palette.alert}>Failed to load appointments.</Text>
      ) : (
        <AppointmentsTable
          items={data.pages.flatMap((page) => page.items)}
          total={data.pages[0].total}
          isAdmin={isAdmin}
          sorting={sorting}
          onSortingChange={setSorting}
          conducted={conducted}
          onConductedChange={setConducted}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          date={date}
          onDateChange={setDate}
        />
      )}
    </Stack>
  )
}

export default AppointmentsPage
