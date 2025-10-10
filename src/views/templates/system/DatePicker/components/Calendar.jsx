import React from 'react';
import styled from 'styled-components';

import Day from './Day';
import Header from './Header';

/**
 * Componente principal del calendario
 */
const Calendar = ({
  currentViewDate,
  selectedDate,
  calendarDays,
  onSelectDate,
  goToPreviousMonth,
  goToNextMonth,
  goToPreviousYear,
  goToNextYear,
  goToCurrentMonth,
  disableDates
}) => {
  // Los días de la semana comenzando con lunes (formato español)
  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Verificar si una fecha debe estar deshabilitada
  const isDateDisabled = (date) => {
    if (!disableDates) return false;
    
    if (typeof disableDates === 'function') {
      return disableDates(date.toJSDate());
    }
    
    return false;
  };

  return (
    <StyledCalendar>
      <Header 
        currentViewDate={currentViewDate}
        goToPreviousMonth={goToPreviousMonth}
        goToNextMonth={goToNextMonth}
        goToPreviousYear={goToPreviousYear}
        goToNextYear={goToNextYear}
        goToCurrentMonth={goToCurrentMonth}
      />
      
      <WeekdaysHeader>
        {weekdays.map((day, index) => (
          <WeekdayCell key={index}>{day}</WeekdayCell>
        ))}
      </WeekdaysHeader>
      
      <DaysGrid>
        {calendarDays.map((dayInfo, index) => (
          <Day 
            key={index}
            dayInfo={dayInfo}
            selectedDate={selectedDate}
            onSelect={onSelectDate}
            disabled={isDateDisabled(dayInfo.date)}
          />
        ))}
      </DaysGrid>
    </StyledCalendar>
  );
};

const StyledCalendar = styled.div`
  width: 100%;
  background-color: white;
  border-radius: var(--border-radius, 8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
`;

const WeekdaysHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: #f9f9f9;
  border-bottom: 1px solid #e8e8e8;
`;

const WeekdayCell = styled.div`
  padding: 0.75rem 0;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0.5rem;
  gap: 0.25rem;
  justify-items: center;
`;

export default Calendar;
