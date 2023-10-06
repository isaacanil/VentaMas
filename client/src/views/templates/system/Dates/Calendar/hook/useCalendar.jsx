// hooks/useCalendar.js
import { useState } from 'react';
import { DateTime } from 'luxon';

export const useCalendar = (selectionType) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(DateTime.local());

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.minus({ months: 1 }));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.plus({ months: 1 }));
  };

  const handleDateClick = (day) => {
    if (selectionType === 'single') {
      setSelectedDate(day);
    } else if (selectionType === 'range') {
      if (!startDate || (startDate && endDate)) {
        setStartDate(day);
        setEndDate(null);  // Reset endDate if a new range is being selected
      } else if (day > startDate) {
        setEndDate(day);
      } else {
        setStartDate(day);
      }
    }
  };

  const handleTodayClick = () => {
    const now = DateTime.local();
    setCurrentMonth(now);
    if (selectionType === 'single') {
      setSelectedDate(now.day);
    } else if (selectionType === 'range') {
      setStartDate(now.day);
      setEndDate(null);  // Reset endDate if "Today" is clicked during range selection
    }
  };

  const month = currentMonth.toFormat("LLLL");
  const year = currentMonth.toFormat("yyyy");
  const monthStart = currentMonth.startOf("month");
  const daysInMonth = monthStart.daysInMonth;
  const firstDayOfMonth = monthStart.weekday;

  return {
    selectedDate,
    startDate,
    endDate,
    currentMonth,
    handlePrevMonth,
    handleNextMonth,
    handleDateClick,
    handleTodayClick,
    month,
    year,
    monthStart,
    daysInMonth,
    firstDayOfMonth
  };
};





