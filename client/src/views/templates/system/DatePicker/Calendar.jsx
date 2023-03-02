import React, { useState } from "react";
import styled from "styled-components";

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
    background-color: #f5f5f5;
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
    background-color: #ccc;
    color: #fff;
  `}
`;

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const Calendar = () => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const handlePrevMonth = () => {
        const prevMonth = new Date(currentMonth);
        prevMonth.setMonth(currentMonth.getMonth() - 1);
        setCurrentMonth(prevMonth);
    };

    const handleNextMonth = () => {
        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(currentMonth.getMonth() + 1);
        setCurrentMonth(nextMonth);
    };

    const today = new Date();
    const month = currentMonth.toLocaleString("default", { month: "long" });
    const year = currentMonth.getFullYear();
    const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, currentMonth.getMonth(), 1).getDay();

    const handleDateClick = (day) => {
        setSelectedDate(day);
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
                                        today.getMonth() === new Date(year, currentMonth.getMonth(), day).getMonth() &&
                                        today.getDate() === day;
                                    const isSelected = selectedDate === day;
                                    return (
                                        <CalendarCell
                                            key={day}
                                            onClick={() => handleDateClick(day)}
                                            isToday={isToday}
                                            isSelected={isSelected}
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
        </CalendarContainer>
    )}
