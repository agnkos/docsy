import { ActionIcon, Popover } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import type { DatesRangeValue } from '@mantine/dates'
import { CalendarDays, X } from 'lucide-react'

import { palette } from '../../../../styles/colors'

type DateFilterProps = {
  value: DatesRangeValue<string>
  onChange: (value: DatesRangeValue<string>) => void
}

export const DateFilter = ({ value, onChange }: DateFilterProps) => {
  const hasValue = value[0] !== null || value[1] !== null

  return (
    <Popover>
      <Popover.Target>
        <ActionIcon
          variant='subtle'
          color={hasValue ? `${palette.violet}` : 'gray'}
          size='sm'
          aria-label='Filter by date'
        >
          <CalendarDays size={16} />
        </ActionIcon>
      </Popover.Target>
      {hasValue && (
        <ActionIcon
          variant='subtle'
          color='gray'
          size='sm'
          aria-label='Clear date filter'
          onClick={() => onChange([null, null])}
        >
          <X size={14} />
        </ActionIcon>
      )}
      <Popover.Dropdown>
        <DatePicker
          type='range'
          allowSingleDateInRange
          value={value}
          onChange={onChange}
          size='xs'
        />
      </Popover.Dropdown>
    </Popover>
  )
}
