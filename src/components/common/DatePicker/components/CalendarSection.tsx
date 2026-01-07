import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { DateTime } from 'luxon';
import React from 'react';
import styled from 'styled-components';

import { WEEK_DAYS } from '@/components/common/DatePicker/constants/presets';
import { renderCalendarGrid } from '@/components/common/DatePicker/utils/dateUtils';

const DATE_LOCALE = 'es';

const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #595959;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: all 0.3s;

  &:hover {
    color: #1890ff;
    background: #f5f5f5;
  }
`;

const MonthYear = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  text-transform: capitalize;
`;

const WeekDaysHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
`;

const WeekDay = styled.div`
  padding: 8px 4px;
  font-size: 12px;
  font-weight: 500;
  color: #8c8c8c;
  text-align: center;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const CalendarDay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  position: relative;
  color: ${(props) => {
    if (!props.$isCurrentMonth) return '#bfbfbf';
    if (props.$isSelected) return 'white';
    if (props.$isToday) return '#1890ff';
    return '#262626';
  }};
  background: ${(props) => {
    if (props.$isSelected) return '#1890ff';
    if (props.$isInRange && !props.$isSelected) return '#e6f7ff';
    return 'transparent';
  }};
  font-weight: ${(props) => {
    if (props.$isSelected || props.$isToday) return '500';
    return '400';
  }};

  ${(props) =>
    props.$isRangeStart &&
    `
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    `}

  ${(props) =>
    props.$isRangeEnd &&
    `
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    `}
    
    ${(props) =>
    props.$isInRange &&
    !props.$isRangeStart &&
    !props.$isRangeEnd &&
    `
        border-radius: 0;
    `}
    
    &:hover {
    ${(props) =>
    !props.$isSelected &&
    `
            background: #f5f5f5;
            color: #1890ff;
        `}
  }

  ${(props) =>
    props.$isToday &&
    !props.$isSelected &&
    `
        border: 1px solid #1890ff;
    `}
`;

export const CalendarSection = ({
  currentDate,
  onNavigateMonth,
  onDateClick,
  onDateHover,
  value,
  mode,
  currentRangeStart,
  currentRangeEnd,
  hoverDate,
}) => {
  const days = renderCalendarGrid(currentDate);
  const today = DateTime.local().setLocale(DATE_LOCALE);

  return (
    <CalendarContainer>
      <CalendarHeader>
        <NavButton
          onClick={() => onNavigateMonth('prev')}
          aria-label="Mes anterior"
        >
          <LeftOutlined />
        </NavButton>
        <MonthYear>
          {currentDate
            .setLocale(DATE_LOCALE)
            .toFormat('LLLL yyyy')}
        </MonthYear>
        <NavButton
          onClick={() => onNavigateMonth('next')}
          aria-label="Mes siguiente"
        >
          <RightOutlined />
        </NavButton>
      </CalendarHeader>

      <WeekDaysHeader>
        {WEEK_DAYS.map((label) => (
          <WeekDay key={label}>{label}</WeekDay>
        ))}
      </WeekDaysHeader>

      <CalendarGrid>
        {days.map((date, index) => {
          const isCurrentMonth = date.month === currentDate.month;
          const isToday = date.hasSame(today, 'day');
          const isSelected =
            mode === 'single'
              ? value &&
              DateTime.isDateTime(value) &&
              date.hasSame(value, 'day')
              : (currentRangeStart &&
                date.hasSame(currentRangeStart, 'day')) ||
              (currentRangeEnd && date.hasSame(currentRangeEnd, 'day'));

          let isInRange = false;
          if (mode === 'range') {
            if (currentRangeStart && (currentRangeEnd || hoverDate)) {
              const start = currentRangeStart;
              const end = currentRangeEnd || hoverDate;
              const isBefore = start.toMillis() < end.toMillis();
              const s = isBefore ? start : end;
              const e = isBefore ? end : start;
              const dayMillis = date.startOf('day').toMillis();
              isInRange =
                dayMillis >= s.startOf('day').toMillis() &&
                dayMillis <= e.startOf('day').toMillis();
            }
          }

          const isRangeStart =
            mode === 'range' &&
            currentRangeStart &&
            date.hasSame(currentRangeStart, 'day');
          const isRangeEnd =
            mode === 'range' &&
            currentRangeEnd &&
            date.hasSame(currentRangeEnd, 'day');

          return (
            <CalendarDay
              key={index}
              onClick={() => onDateClick(date)}
              $isCurrentMonth={isCurrentMonth}
              $isToday={isToday}
              $isSelected={isSelected}
              $isInRange={isInRange}
              $isRangeStart={isRangeStart}
              $isRangeEnd={isRangeEnd}
              onMouseEnter={() => mode === 'range' && onDateHover(date)}
              onMouseLeave={() => mode === 'range' && onDateHover(null)}
            >
              {date.day}
            </CalendarDay>
          );
        })}
      </CalendarGrid>
    </CalendarContainer>
  );
};
