import React, { useState } from "react";
import styled from "styled-components";

const StyledDateFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
const startOfDay = new Date();
startOfDay.setUTCHours(0, 0, 0, 0);
const startOfDayTimestamp = startOfDay.getTime();

const endOfDay = new Date();
endOfDay.setUTCHours(23, 59, 0, 0);
const endOfDayTimestamp = endOfDay.getTime();

const DateFilter = ({ onChange }) => {
  const [startDate, setStartDate] = useState(startOfDayTimestamp);
  const [endDate, setEndDate] = useState(endOfDayTimestamp);



  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    onChange({ startDate: new Date(e.target.value).getTime(), endDate });
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    onChange({ startDate, endDate: new Date(e.target.value).getTime() });
  };

  return (
    <StyledDateFilter>
      <label htmlFor="start-date">Fecha inicio:</label>
      <input
        type="datetime-local"
        id="start-date"
        value={startDate ? new Date(startDate).toISOString().slice(0, -1) : ""}
        onChange={handleStartDateChange}
        min={new Date(startOfDayTimestamp).toISOString().slice(0, -1)}
      />
      <label htmlFor="end-date">Fecha fin:</label>
      <input
        type="datetime-local"
        id="end-date"
        value={endDate ? new Date(endDate).toISOString().slice(0, -1) : ""}
        onChange={handleEndDateChange}
        max={new Date(endOfDayTimestamp).toISOString().slice(0, -1)}
      />
    </StyledDateFilter>
  );
};

export default DateFilter;
