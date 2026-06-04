import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { DateTime } from 'luxon';
import React from 'react';
import styled from 'styled-components';

import {
  DATE_LOCALE,
  getLocalizedNow,
} from '@/components/common/DatePicker/constants/dateLocale';
import { WEEK_DAYS } from '@/components/common/DatePicker/constants/presets';
import { renderCalendarGrid } from '@/components/common/DatePicker/utils/dateUtils';
import type { DatePickerMode, DatePickerValue } from '../types';

const DAYS_PER_WEEK = 7;

interface RangeSegment {
  row: number;
  startColumn: number;
  endColumn: number;
}

const buildRangeSegments = ({
  currentRangeEnd,
  currentRangeStart,
  days,
  hoverDate,
  mode,
}: {
  currentRangeEnd: DateTime | null;
  currentRangeStart: DateTime | null;
  days: DateTime[];
  hoverDate: DateTime | null;
  mode: DatePickerMode;
}): RangeSegment[] => {
  if (mode !== 'range') return [];

  const end = currentRangeEnd || hoverDate;
  if (!currentRangeStart || !end) return [];

  const isForward = currentRangeStart.toMillis() <= end.toMillis();
  const startOfRange = (isForward ? currentRangeStart : end).startOf('day');
  const endOfRange = (isForward ? end : currentRangeStart).startOf('day');
  const rowCount = Math.ceil(days.length / DAYS_PER_WEEK);
  const segments: RangeSegment[] = [];

  for (let row = 0; row < rowCount; row += 1) {
    const rowStartIndex = row * DAYS_PER_WEEK;
    const rowDays = days.slice(rowStartIndex, rowStartIndex + DAYS_PER_WEEK);
    const selectedColumns = rowDays.reduce<number[]>(
      (columns, date, column) => {
        const day = date.startOf('day');
        if (day >= startOfRange && day <= endOfRange) {
          columns.push(column);
        }
        return columns;
      },
      [],
    );

    if (!selectedColumns.length) continue;

    segments.push({
      row,
      startColumn: selectedColumns[0],
      endColumn: selectedColumns[selectedColumns.length - 1],
    });
  }

  return segments;
};

const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: fit-content;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  width: calc(7 * 38px);
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
  grid-template-columns: repeat(7, 38px);
`;

const WeekDay = styled.div`
  padding: 4px 0;
  font-size: 12px;
  font-weight: 500;
  color: #8c8c8c;
  text-align: center;
`;

const CalendarGrid = styled.div`
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: repeat(7, 38px);
  gap: 0;
`;

const RangeTraceSvg = styled.svg`
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;

  rect {
    fill: var(--ds-color-action-primary-subtle);
    shape-rendering: geometricprecision;
  }
`;

interface CalendarDayProps {
  $isCurrentMonth?: boolean;
  $isInRange?: boolean;
  $isSelected?: boolean;
  $isToday?: boolean;
}

const CalendarDay = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  font-size: 13px;
  cursor: pointer;
`;

const DayNumber = styled.span<CalendarDayProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  border-radius: 999px;
  color: ${(props: CalendarDayProps) => {
    if (props.$isSelected) return 'var(--ds-color-text-inverse)';
    if (!props.$isCurrentMonth) return 'var(--ds-color-text-disabled)';
    if (props.$isToday) return 'var(--ds-color-action-primary)';
    return 'var(--ds-color-text-primary)';
  }};
  background: ${(props: CalendarDayProps) => {
    if (props.$isSelected) return 'var(--ds-color-action-primary)';
    return 'transparent';
  }};
  font-weight: ${(props: CalendarDayProps) => {
    if (props.$isSelected || props.$isToday) return '500';
    return '400';
  }};
  line-height: 1;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;

  ${(props: CalendarDayProps) =>
    props.$isToday &&
    !props.$isSelected &&
    `
        border-color: var(--ds-color-action-primary);
    `}

  ${(props: CalendarDayProps) =>
    !props.$isSelected &&
    !props.$isInRange &&
    `
      ${CalendarDay}:hover & {
        color: var(--ds-color-action-primary);
        background: var(--ds-color-bg-muted);
      }
    `}

  ${(props: CalendarDayProps) =>
    props.$isSelected &&
    !props.$isInRange &&
    `
      ${CalendarDay}:hover & {
        color: var(--ds-color-text-inverse);
        background: var(--ds-color-action-primary-hover);
      }
    `}
`;

interface CalendarSectionProps {
  currentDate: DateTime;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onDateClick: (date: DateTime) => void;
  onDateHover: (date: DateTime | null) => void;
  value: DatePickerValue;
  mode: DatePickerMode;
  currentRangeStart: DateTime | null;
  currentRangeEnd: DateTime | null;
  hoverDate: DateTime | null;
}

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
}: CalendarSectionProps) => {
  const days = renderCalendarGrid(currentDate);
  const rowCount = Math.ceil(days.length / DAYS_PER_WEEK);
  const rangeSegments = buildRangeSegments({
    currentRangeEnd,
    currentRangeStart,
    days,
    hoverDate,
    mode,
  });
  const today = getLocalizedNow();
  const isDateInRange = (date: DateTime) => {
    if (mode !== 'range') return false;

    const end = currentRangeEnd || hoverDate;
    if (!currentRangeStart || !end) return false;

    const isForward = currentRangeStart.toMillis() <= end.toMillis();
    const startOfRange = (isForward ? currentRangeStart : end).startOf('day');
    const endOfRange = (isForward ? end : currentRangeStart).startOf('day');
    const day = date.startOf('day');

    return day >= startOfRange && day <= endOfRange;
  };

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
          {currentDate.setLocale(DATE_LOCALE).toFormat('LLLL yyyy')}
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
        {rangeSegments.length ? (
          <RangeTraceSvg
            aria-hidden="true"
            focusable="false"
            preserveAspectRatio="none"
            viewBox={`0 0 ${DAYS_PER_WEEK} ${rowCount}`}
          >
            {rangeSegments.map((segment) => (
              <rect
                key={`${segment.row}:${segment.startColumn}-${segment.endColumn}`}
                height={0.8}
                rx={0.4}
                width={segment.endColumn - segment.startColumn + 1}
                x={segment.startColumn}
                y={segment.row + 0.1}
              />
            ))}
          </RangeTraceSvg>
        ) : null}
        {days.map((date) => {
          const isCurrentMonth = date.month === currentDate.month;
          const isToday = date.hasSame(today, 'day');
          const isInRange = isDateInRange(date);
          const isSelected =
            mode === 'single'
              ? value &&
                DateTime.isDateTime(value) &&
                date.hasSame(value, 'day')
              : (currentRangeStart && date.hasSame(currentRangeStart, 'day')) ||
                (currentRangeEnd && date.hasSame(currentRangeEnd, 'day'));

          return (
            <CalendarDay
              key={date.toISODate() || date.toMillis()}
              onClick={() => onDateClick(date)}
              onMouseEnter={() => mode === 'range' && onDateHover(date)}
              onMouseLeave={() => mode === 'range' && onDateHover(null)}
            >
              <DayNumber
                $isCurrentMonth={isCurrentMonth}
                $isInRange={isInRange}
                $isToday={isToday}
                $isSelected={Boolean(isSelected)}
              >
                {date.day}
              </DayNumber>
            </CalendarDay>
          );
        })}
      </CalendarGrid>
    </CalendarContainer>
  );
};
