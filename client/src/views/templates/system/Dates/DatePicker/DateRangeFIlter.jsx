import { useEffect, useState } from "react";
import styled from "styled-components";

const DateRangeFilter = ({ date }) => {
  const [startDate, setStartDate] = useState(new Date().setHours(0, 0, 0, 0));
  const [endDate, setEndDate] = useState(new Date());

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(e.target.value);
  };

  useEffect(() => {
    date({ startDate, endDate })
  }, [startDate, endDate])

  return (
    <DateRangeFilterContainer>
      <DateInput
        type="date"
        id="start-date"
        name="start-date"
        value={new Date(startDate).toLocaleDateString('en-CA')}
        onChange={(e) => handleStartDateChange(e)}
      />
      <DateInput
        type="date"
        id="end-date"
        name="end-date"
        value={new Date(endDate).toLocaleDateString('en-CA')}
        onChange={(e) => handleEndDateChange(e)}
      />
    </DateRangeFilterContainer>
  );
};

export default DateRangeFilter;

const DateRangeFilterContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const DateInput = styled.input`
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-right: 10px;
`;