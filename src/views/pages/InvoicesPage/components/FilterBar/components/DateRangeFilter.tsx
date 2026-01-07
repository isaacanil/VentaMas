// @ts-nocheck
import { DateTime } from 'luxon';
import React, { useCallback, useMemo } from 'react';

import { DatePicker } from '@/components/common/DatePicker/DatePicker';

import { FilterField } from './FilterField';

export const DateRangeFilter = ({ datesSelected, setDatesSelected, label }) => {
  const handleDateChange = useCallback(
    (value) => {
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
