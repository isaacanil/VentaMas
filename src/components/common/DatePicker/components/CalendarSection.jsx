import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import React from 'react';
import styled from 'styled-components';

import 'dayjs/locale/es';
import { WEEK_DAYS } from '../constants/presets';
import { renderCalendarGrid } from '../utils/dateUtils';

dayjs.extend(weekday);
dayjs.locale('es');

// Configurar para que la semana empiece en domingo
const locale = dayjs.Ls.es;
if (locale) {
  locale.weekStart = 0; // 0 = domingo
}

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

  return (
    <CalendarContainer>
      <CalendarHeader>
        <NavButton onClick={() => onNavigateMonth('prev')}>
          <LeftOutlined />
        </NavButton>
        <MonthYear>{currentDate.format('MMMM YYYY')}</MonthYear>
        <NavButton onClick={() => onNavigateMonth('next')}>
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
          const isCurrentMonth = date.month() === currentDate.month();
          const isToday = date.isSame(dayjs(), 'day');
          const isSelected =
            mode === 'single'
              ? value && dayjs.isDayjs(value) && date.isSame(value, 'day')
              : (currentRangeStart && date.isSame(currentRangeStart, 'day')) ||
                (currentRangeEnd && date.isSame(currentRangeEnd, 'day'));

          let isInRange = false;
          if (mode === 'range') {
            if (currentRangeStart && (currentRangeEnd || hoverDate)) {
              const start = currentRangeStart;
              const end = currentRangeEnd || hoverDate;
              const s = start.isBefore(end) ? start : end;
              const e = start.isBefore(end) ? end : start;
              isInRange =
                date.isSameOrAfter(s, 'day') && date.isSameOrBefore(e, 'day');
            }
          }

          const isRangeStart =
            mode === 'range' &&
            currentRangeStart &&
            date.isSame(currentRangeStart, 'day');
          const isRangeEnd =
            mode === 'range' &&
            currentRangeEnd &&
            date.isSame(currentRangeEnd, 'day');

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
              {date.date()}
            </CalendarDay>
          );
        })}
      </CalendarGrid>
    </CalendarContainer>
  );
};
