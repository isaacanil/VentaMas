import React, { useState } from "react";
import styled from "styled-components";
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
import { DateTime } from "luxon";
import { Button } from "../Button/Button";

export const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(DateTime.local());

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.minus({ months: 1 }));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.plus({ months: 1 }));
  };

  const month = currentMonth.toFormat("LLLL");
  const year = currentMonth.toFormat("yyyy");
  const monthStart = currentMonth.startOf("month");
  const daysInMonth = monthStart.daysInMonth;
  const firstDayOfMonth = monthStart.weekday;

  const handleDateClick = (day) => {
    setSelectedDate(day);
  };

  const handleTodayClick = () => {
    setCurrentMonth(DateTime.local());
    setSelectedDate(DateTime.local().day);
  };

  return (
    <CalendarContainer>
      <CalendarHeader>
        <CalendarButton onClick={handlePrevMonth}>Prev</CalendarButton>
        <CalendarMonth>{month} {year}</CalendarMonth>
        <CalendarButton onClick={handleNextMonth}>Next</CalendarButton>
      </CalendarHeader>
      <CalendarTable>
        <thead>
          <CalendarRow>
            {daysOfWeek.map((day) => (
              <CalendarCell key={day}>{day}</CalendarCell>
            ))}
          </CalendarRow>
        </thead>
        <tbody>
          {[...Array(Math.ceil((daysInMonth + firstDayOfMonth) / 7)).keys()].map(
            (weekIndex) => (
              <CalendarRow key={weekIndex}>
                {[...Array(7).keys()].map((dayIndex) => {
                  const day = weekIndex * 7 + dayIndex - firstDayOfMonth + 1;
                  const isToday =
                    currentMonth.hasSame(DateTime.local(), "month") &&
                    day === DateTime.local().day;
                  const isSelected = selectedDate === day;
                  return (
                    <CalendarCell
                      key={day}
                      onClick={() => handleDateClick(day)}
                      isToday={isToday}
                      isSelected={isSelected}
                      aria-label={isSelected ? `Selected: ${day} ${month} ${year}` : `${day} ${month} ${year}`}
                    >
                      {day > 0 && day <= daysInMonth ? day : ""}
                    </CalendarCell>
                  );
                })}
              </CalendarRow>
            )
          )}
        </tbody>
      </CalendarTable>
      <Button 
      title="Today"
      onClick={handleTodayClick}
      />
    </CalendarContainer>
  );
};




const CalendarContainer = styled.div`
  display: inline-block;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CalendarMonth = styled.h2`
  font-size: 24px;
  font-weight: 500;
  margin: 0;
`;

const CalendarButton = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  &:hover {
    text-decoration: underline;
  }
`;

const CalendarTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const CalendarRow = styled.tr``;

const CalendarCell = styled.td`
  border: 1px solid #eee;
  padding: 8px;
  text-align: center;
  cursor: pointer;
  &:hover {
    background-color: #188dec;
  }
  ${({ isToday }) =>
        isToday &&
        `
    font-weight: bold;
    border: 1px solid #ccc;
  `}
  ${({ isSelected }) =>
        isSelected &&
        `
    background-color: #4e8fe4;
    color: #fff;
  `}
`;