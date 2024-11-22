import React, { useEffect } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { DatePicker as AntdDatePicker } from "antd"; // Importamos como AntdDatePicker
import { Button } from "../../Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarXmark } from "@fortawesome/free-solid-svg-icons";
import { DateRangeFilter } from "../../Button/TimeFilterButton/DateRangeFilter";

const { RangePicker } = AntdDatePicker;

const getDefaultDates = () => {
    const today = dayjs().startOf('day');
    return [today.toISOString(), today.endOf('day').toISOString()];
};

const getEmptyDates = () => {
    return [null, null];
};

export const DatePicker = ({
    setDates,
    dates,
    datesDefault,
    dateOptionsMenu = false,
}) => {
    useEffect(() => {
        if (datesDefault === "today") {
            setDates(getDefaultDates());
        }
    }, [datesDefault]);

    const handleRangeChange = (dates) => {
        if (dates) {
            setDates({
                startDate: dates[0].startOf('day').valueOf(),
                endDate: dates[1].endOf('day').valueOf(),
            });
        } else {
            setDates(getEmptyDates());
        }
    };

    const handleClear = () => {
        setDates(getEmptyDates());
    };

    return (
        <Container>
            <Col>
                <RangePicker
                    value={
                        dates?.startDate && dates?.endDate
                            ? [
                                dayjs(dates.startDate),
                                dayjs(dates.endDate),
                            ]
                            : null
                    }
                    format="DD/MM/YY"
                    onChange={handleRangeChange}
                    style={{ width:"200px"  }}
                />
            </Col>
            {datesDefault === "empty" && (
                <Col>
                    <Button
                        startIcon={<FontAwesomeIcon icon={faCalendarXmark} />}
                        title={"Limpiar"}
                        onClick={handleClear}
                    />
                </Col>
            )}
            {dateOptionsMenu && (
                <DateRangeFilter
                    setDates={setDates}
                    dates={dates}
                />
            )}
        </Container>
    );
};

// Estilos adaptados
const Container = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns:max-content;
  gap: 0.4em;
`;

const Col = styled.div`
  display: flex;
  justify-content: end;
  flex-direction: column;
  gap: 0.2em;
`;
