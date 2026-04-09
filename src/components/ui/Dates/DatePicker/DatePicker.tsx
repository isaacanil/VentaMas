import { faCalendarXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';
import React, { useEffect } from 'react';
import styled from 'styled-components';

import AntDatePicker from '@/components/DatePicker';
import { Button } from '@/components/ui/Button/Button';

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
          style={{ width: '200px' }}
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

// Estilos adaptados
const Container = styled.div`
  display: grid;
  grid-template-columns: max-content;
  gap: 0.4em;
  width: 100%;
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  justify-content: end;
`;
