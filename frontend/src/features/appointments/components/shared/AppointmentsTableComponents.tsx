import { ActionIcon, Popover } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import type { DatesRangeValue } from '@mantine/dates'
import { CalendarDays } from 'lucide-react'
import { useEffect } from 'react'

type DateFilterProps = {
  value: DatesRangeValue<string>
  onChange: (value: DatesRangeValue<string>) => void
}

export const DateFilter = ({ value, onChange }: DateFilterProps) => {
  useEffect(() => {
    console.log('value', value)
  }, [value])
  return (
    <Popover>
      <Popover.Target>
        <ActionIcon variant='subtle' color='gray' size='sm' aria-label='Filter by date'>
          <CalendarDays size={16} />
        </ActionIcon>
      </Popover.Target>
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
