import React, { useState } from 'react';
import styled from 'styled-components';

const DatePickerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const DatePickerInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

const DatePickerInput = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const DatePickerLabel = styled.label`
  font-size: 14px;
`;

const DatePicker = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const handleStartDateChange = (event) => {
    setStartDate(new Date(event.target.value));
  };

  const handleEndDateChange = (event) => {
    setEndDate(new Date(event.target.value));
  };

  // Set default start and end dates to today's morning and evening respectively
  const today = new Date();
  const defaultStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const defaultEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return (
    <DatePickerWrapper>
      <DatePickerInputContainer>
        <DatePickerLabel>Fecha inicio:</DatePickerLabel>
        <DatePickerInput type="date" value={startDate.toISOString().substr(0, 10)} onChange={handleStartDateChange} min={defaultStartDate.toISOString().substr(0, 10)} />
      </DatePickerInputContainer>
      <DatePickerInputContainer>
        <DatePickerLabel>Fecha fin:</DatePickerLabel>
        <DatePickerInput type="date" value={endDate.toISOString().substr(0, 10)} onChange={handleEndDateChange} min={defaultEndDate.toISOString().substr(0, 10)} />
      </DatePickerInputContainer>
    </DatePickerWrapper>
  );
};

export default DatePicker;
