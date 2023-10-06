// components/CalendarBody.js
import { DateTime } from 'luxon';
import React from 'react';
import styled from 'styled-components';

export const CalendarBody = ({
    selectionType,
    daysOfWeek,
    currentMonth,
    handleDateClick,
    selectedDate,
    startDate,
    endDate,
    daysInMonth,
    firstDayOfMonth,
    month,
    year
}) => {
    return (
        <GridContainer>
            {daysOfWeek.map((day) => (
                <GridItem key={day}>{day}</GridItem>
            ))}
            {[...Array(Math.ceil((daysInMonth + firstDayOfMonth) / 7)).keys()].map(
                (weekIndex) => (
                    [...Array(7).keys()].map((dayIndex) => {
                        const day = weekIndex * 7 + dayIndex - firstDayOfMonth + 1;
                        
                        const date = currentMonth.set({ day });
                        const isToday = date.hasSame(DateTime.local(), "day");
                        const isSelected = selectionType === 'single' && selectedDate === day;
                        const isStart = selectionType === 'range' && date.hasSame(DateTime.fromObject({ year: currentMonth.year, month: currentMonth.month, day: startDate }), "day");
                        const isEnd = selectionType === 'range' && date.hasSame(DateTime.fromObject({ year: currentMonth.year, month: currentMonth.month, day: endDate }), "day");
                        const isInRange = selectionType === 'range' && startDate && endDate && day > startDate && day < endDate;

                        return (
                            <GridItem
                                key={day}
                                onClick={() => handleDateClick(day)}
                                isToday={isToday}
                                isSelected={isSelected}
                                
                                isStart={isStart}
                                isEnd={isEnd}
                                isInRange={isInRange}
                                aria-label={isSelected ? `Selected: ${day} ${month} ${year}` : `${day} ${month} ${year}`}
                            >
                                {day > 0 && day <= daysInMonth ? day : ""}
                            </GridItem>
                        );
                    })
                )
            )}
        </GridContainer>
    );
};

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
    ${({ isToday, isSelected, isStart, isEnd, isInRange }) => `
        font-weight: ${isToday ? 'bold' : 'normal'};
        border: ${isToday ? '1px solid #ccc' : 'none'};
        background-color: ${isSelected ? '#4e8fe4' : isStart || isEnd ? '#4e8fe4' : isInRange ? '#c8e4fc' : '#fff'};
        color: ${isSelected || isStart || isEnd ? '#fff' : '#000'};
    `}
`;

