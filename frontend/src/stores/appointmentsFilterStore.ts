import { create } from 'zustand'
import type { ConductedFilter } from '../features/appointments/conductedFilter'
import type { DatesRangeValue } from '@mantine/dates'
import type { OnChangeFn, SortingState } from '@tanstack/react-table'

import { DEFAULT_SORTING } from '../features/appointments/sorting'

type AppointmentsFilterState = {
  patientSearch: string
  doctorSearch: string
  showCancelled: boolean
  conducted: ConductedFilter
  sorting: SortingState
  setPatientSearch: (patientSearch: string) => void
  setDoctorSearch: (doctorSearch: string) => void
  setShowCancelled: (showCancelled: boolean) => void
  setConducted: (conducted: ConductedFilter) => void
  setSorting: OnChangeFn<SortingState>
  date: DatesRangeValue<string>
  setDate: (date: DatesRangeValue<string>) => void
  reset: () => void
  restoreOnReturn: boolean
  setRestoreOnReturn: (value: boolean) => void
}

const EMPTY_DATE_RANGE: DatesRangeValue<string> = [null, null]

const initialState = {
  patientSearch: '',
  doctorSearch: '',
  showCancelled: false,
  conducted: 'all',
  sorting: DEFAULT_SORTING,
  date: EMPTY_DATE_RANGE,
} as const

export const useAppointmentsFilterStore = create<AppointmentsFilterState>((set) => ({
  ...initialState,
  setPatientSearch: (patientSearch) => set({ patientSearch }),
  setDoctorSearch: (doctorSearch) => set({ doctorSearch }),
  setShowCancelled: (showCancelled) => set({ showCancelled }),
  setConducted: (conducted) => set({ conducted }),
  setSorting: (updater) =>
    set((state) => ({
      sorting: typeof updater === 'function' ? updater(state.sorting) : updater,
    })),
  setDate: (date) => set({ date }),
  reset: () => set(initialState),
  restoreOnReturn: false,
  setRestoreOnReturn: (restoreOnReturn) => set({ restoreOnReturn }),
}))
