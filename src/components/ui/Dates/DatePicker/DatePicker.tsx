import { faCalendarXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';
import { useEffect } from 'react';

import AntDatePicker from '@/components/DatePicker';
import { Button } from '@/components/ui/Button/Button';

import { Col, Container, RANGE_PICKER_STYLE } from './DatePicker.styles';

const { RangePicker } = AntDatePicker;
const DATE_LOCALE = 'es';

const getDefaultDates = () => {
  const today = DateTime.local().setLocale(DATE_LOCALE).startOf('day');
  return {
    startDate: today.toMillis(),
    endDate: today.endOf('day').toMillis(),
  };
};

const getEmptyDates = () => {
  return {
    startDate: null,
    endDate: null,
  };
};

export type DateRangeValue = {
  startDate: number | null;
  endDate: number | null;
};

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
  useEffect(() => {
    if (datesDefault === 'today') {
      setDates(getDefaultDates());
    }
  }, [datesDefault, setDates]);

  const handleRangeChange = (dates: [DateTime, DateTime] | null) => {
    if (dates) {
      setDates({
        startDate: dates[0].startOf('day').toMillis(),
        endDate: dates[1].endOf('day').toMillis(),
      });
    } else {
      setDates(getEmptyDates());
    }
  };

  const handleClear = () => {
    setDates(getEmptyDates());
  };

  return (
    <Container>
      <Col>
        <RangePicker
          value={
            dates?.startDate && dates?.endDate
              ? [
                  DateTime.fromMillis(dates.startDate).setLocale(DATE_LOCALE),
                  DateTime.fromMillis(dates.endDate).setLocale(DATE_LOCALE),
                ]
              : null
          }
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
