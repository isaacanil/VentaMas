import React, { useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { DatePicker } from '../../../../../../components/common/DatePicker/DatePicker';
import { FilterField } from './FilterField';

export const DateRangeFilter = ({ datesSelected, setDatesSelected }) => {
  const handleDateChange = useCallback((value) => {
    if (Array.isArray(value)) {
      setDatesSelected({
        startDate: value[0] ? value[0].startOf('day').valueOf() : null,
        endDate: value[1] ? value[1].endOf('day').valueOf() : null,
      });
    } else if (value) {
      setDatesSelected({
        startDate: value.startOf('day').valueOf(),
        endDate: value.endOf('day').valueOf(),
      });
    } else {
      setDatesSelected({ startDate: null, endDate: null });
    }
  }, [setDatesSelected]);

  const dateValue = useMemo(() => {
    if (!datesSelected?.startDate && !datesSelected?.endDate) return null;
    return [
      datesSelected?.startDate ? dayjs(datesSelected.startDate) : null,
      datesSelected?.endDate ? dayjs(datesSelected.endDate) : null,
    ];
  }, [datesSelected]);

  return (
    <FilterField label="Fechas">
      <DatePicker
        mode="range"
        value={dateValue}
        onChange={handleDateChange}
        allowClear
        size="middle"
      />
    </FilterField>
  );
}; 