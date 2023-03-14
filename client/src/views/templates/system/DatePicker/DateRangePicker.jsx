import React, { useState } from "react";
import styled from "styled-components";
import { FiCalendar } from "react-icons/fi";

const Container = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const Input = styled.input`
  padding: 8px;
  border: none;
  border-bottom: 2px solid #ccc;
  font-size: 16px;
  flex: 1;
`;

const Select = styled.select`
  margin-left: 16px;
  padding: 8px;
  font-size: 16px;
`;

const options = [
    { label: "Anual", value: "year" },
    { label: "Mensual", value: "month" },
    { label: "Semanal", value: "week" },
    { label: "Diario", value: "day" },
    { label: "Trimestral", value: "quarter" },
];

const DateRangePicker = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const handleSelectChange = (event) => {
        const value = event.target.value;


        switch (value) {
            case "year":
                setEndDate(
                    new Date(
                        startDate.getFullYear() + 1,
                        startDate.getMonth(),
                        startDate.getDate()
                    ));
                break;
            case "month":
                setEndDate(
                    new Date(
                        startDate.getFullYear(),
                        startDate.getMonth() + 1,
                        startDate.getDate()
                    ));
                break;
            case "week":
                setEndDate(
                    new Date(
                        startDate.getFullYear(),
                        startDate.getMonth(),
                        startDate.getDate() + 7
                    ));
                break;
            case "day":
                setEndDate(new Date(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate() + 1
                ));
                break;
            case "quarter":
                setEndDate(new Date(
                    startDate.getFullYear(),
                    startDate.getMonth() + 3,
                    startDate.getDate()
                ));
                break;
            default:
                break;
        }

        console.log("End date:", endDate);
    };

    return (
        <Container>
            <FiCalendar />
            <Input
                type="date"
                value={startDate instanceof Date ? startDate.toISOString().substr(0, 10) : startDate}
                onChange={(event) => setStartDate(new Date(event.target.value))}
            />
            <Select onChange={handleSelectChange}>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </Select>
            {startDate && (
                    endDate instanceof Date ? endDate.toISOString().substr(0, 10) : endDate
            )}
        </Container>
    );
};

export default DateRangePicker;
