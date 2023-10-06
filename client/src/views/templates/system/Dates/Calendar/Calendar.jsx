import React, { useState } from "react";
import styled from "styled-components";
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
import { DateTime } from "luxon";
import { Button } from "../../Button/Button";
import { CalendarBody } from "./components/CalendarBody/CalendarBody";
import { useCalendar } from "./hook/useCalendar";

export const Calendar = ({ selectionType = "single" }) => {
  const {
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
    firstDayOfMonth,
  } = useCalendar(selectionType);

  return (
    <CalendarContainer>
      <CalendarHeader>
        <CalendarButton onClick={handlePrevMonth}>Prev</CalendarButton>
        <CalendarMonth>{month} {year}</CalendarMonth>
        <CalendarButton onClick={handleNextMonth}>Next</CalendarButton>
      </CalendarHeader>

      <CalendarBody
        selectionType={selectionType}
        selectedDate={selectedDate}
        startDate={startDate}
        endDate={endDate}
        daysOfWeek={daysOfWeek}
        currentMonth={currentMonth}
        handleDateClick={handleDateClick}
        monthStart={monthStart}
        daysInMonth={daysInMonth}
        firstDayOfMonth={firstDayOfMonth}
        month={month}
        year={year}
      />
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
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1000;
  width: 300px;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CalendarMonth = styled.h2`
  font-size: 16px;
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
const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #eee;
`;

const GridItem = styled.div`
  background-color: #fff;
  padding: 2px;
  text-align: center;
  cursor: pointer;
  ${({ isToday }) => isToday && `
    font-weight: bold;
    border: 1px solid #ccc;
  `}
  ${({ isSelected }) => isSelected && `
    background-color: #4e8fe4;
    color: #fff;
  `}
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