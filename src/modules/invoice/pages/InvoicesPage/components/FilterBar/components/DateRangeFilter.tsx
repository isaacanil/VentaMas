import { DateTime } from 'luxon';
import type { ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';

import { DatePicker } from '@/components/common/DatePicker/DatePicker';
import type { DateRangeSelection } from '@/types/invoiceFilters';

import { FilterField } from './FilterField';

type DatePickerValue = DateTime | [DateTime | null, DateTime | null] | null;

type DateRangeFilterProps = {
  datesSelected: DateRangeSelection;
  setDatesSelected: (next: DateRangeSelection) => void;
  label?: ReactNode;
};

export const DateRangeFilter = ({ datesSelected, setDatesSelected, label }: DateRangeFilterProps) => {
  const handleDateChange = useCallback(
    (value: DatePickerValue) => {
      if (Array.isArray(value)) {
        setDatesSelected({
          startDate: value[0] ? value[0].startOf('day').toMillis() : null,
          endDate: value[1] ? value[1].endOf('day').toMillis() : null,
        });
      } else if (value) {
        setDatesSelected({
          startDate: value.startOf('day').toMillis(),
          endDate: value.endOf('day').toMillis(),
        });
      } else {
        setDatesSelected({ startDate: null, endDate: null });
      }
    },
    [setDatesSelected],
  );

  const dateValue = useMemo(() => {
    if (!datesSelected?.startDate && !datesSelected?.endDate) return null;
    return [
      datesSelected?.startDate
        ? DateTime.fromMillis(datesSelected.startDate)
        : null,
      datesSelected?.endDate ? DateTime.fromMillis(datesSelected.endDate) : null,
    ];
  }, [datesSelected]);

  return (
    <FilterField label={label ?? 'Fechas'}>
      <DatePicker
        mode="range"
        value={dateValue}
        onChange={handleDateChange}
        allowClear
        size="middle"
        style={{ width: '100%' }}
      />
    </FilterField>
  );
};
