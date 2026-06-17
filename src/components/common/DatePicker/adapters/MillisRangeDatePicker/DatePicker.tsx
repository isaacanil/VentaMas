import { faCalendarXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo, useState } from 'react';

import AntDatePicker from '@/components/DatePicker';
import { Button } from '@/components/ui/Button';

import { Col, Container, RANGE_PICKER_STYLE } from './DatePicker.styles';
import {
  getDefaultDates,
  getEmptyDates,
  hasDateRangeValue,
  toDateRangeValue,
  toRangePickerValue,
  type DateRangeValue,
  type RangePickerValue,
} from './utils/dateRangeAdapter';

const { RangePicker } = AntDatePicker;
export type { DateRangeValue } from './utils/dateRangeAdapter';

export type DatePickerProps = {
  setDates: (dates: DateRangeValue) => void;
  dates: DateRangeValue | null;
  datesDefault?: 'today' | 'empty' | string;
};

export const DatePicker = ({
  setDates,
  dates,
  datesDefault,
}: DatePickerProps) => {
  const [hasUserChangedDates, setHasUserChangedDates] = useState(false);
  const defaultDates = useMemo(
    () => (datesDefault === 'today' ? getDefaultDates() : null),
    [datesDefault],
  );
  const displayDates = hasDateRangeValue(dates)
    ? dates
    : !hasUserChangedDates && datesDefault === 'today'
      ? defaultDates
      : null;

  const handleRangeChange = (dates: RangePickerValue) => {
    setHasUserChangedDates(true);
    setDates(toDateRangeValue(dates));
  };

  const handleClear = () => {
    setHasUserChangedDates(true);
    setDates(getEmptyDates());
  };

  return (
    <Container>
      <Col>
        <RangePicker
          value={toRangePickerValue(displayDates)}
          format="DD/MM/YY"
          onChange={handleRangeChange}
          style={RANGE_PICKER_STYLE}
        />
      </Col>
      {datesDefault === 'empty' && (
        <Col>
          <Button
            startIcon={<FontAwesomeIcon icon={faCalendarXmark} />}
            title={'Limpiar'}
            onClick={handleClear}
          />
        </Col>
      )}
    </Container>
  );
};
