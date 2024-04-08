import { useEffect, useRef, useState } from "react";
import styled from "styled-components"
import { DateTime } from "luxon";
import { Button } from "../../Button/Button";
import { icons } from "../../../../../constants/icons/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarXmark } from "@fortawesome/free-solid-svg-icons";
import { DateRangeFilter } from "../../Button/TimeFilterButton/DateRangeFilter";
import { getDateRange } from "../../../../../utils/date/getDateRange";
import { Input } from "../../../../pages/Contact/Provider/components/OrderFilter/OrderMenuFilter/Input";
const getDefaultDates = () => {
    const today = DateTime.local().startOf('day');
    return {
        startDate: today.toMillis(),
        endDate: today.endOf('day').toMillis()
    };
}

const getEmptyDates = () => {
    return {
        startDate: null,
        endDate: null
    };
}


export const DatePicker = ({
    setDates,
    dates,
    datesDefault,
    inputMovilWidth,
    dateOptionsMenu = false
}) => {
    const inputRef = useRef(null);

    const handleSelectDateByDefault = () => {
        if (datesDefault) { setDates(getDefaultDates(datesDefault)); }
        if (datesDefault === "empty") { setDates(getEmptyDates()); }
    }

    useEffect(() => {
        switch (datesDefault) {
            case "today":
                setDates(getDefaultDates());
                break;
        }
    }, []);



    return (
        <Container>

            <Col>
                <Label>Fecha Inicio</Label>
                <InputDate
                    value={dates?.startDate ? DateTime.fromMillis(dates?.startDate).toISODate() : ""}
                    max={dates?.endDate ? DateTime.fromMillis(dates?.endDate).toISODate() : null}
                    type="date"
                    name="startDate"
                    inputMovilWidth={inputMovilWidth}
                    onChange={(e) => setDates({
                        ...dates,
                        startDate: DateTime.fromISO(e.target.value).startOf('day').toMillis()
                    })}
                />
            </Col>
            <Col>
                <Label>Fecha Fin</Label>
                <InputDate
                    value={dates?.endDate ? DateTime.fromMillis(dates?.endDate).toISODate() : ""}
                    min={dates?.startDate ? DateTime.fromMillis(dates?.startDate).toISODate() : null}
                    max={DateTime.local().toISODate()}
                    type="date"
                    name="endDate"
                    inputMovilWidth={inputMovilWidth}
                    onChange={(e) => setDates({
                        ...dates,
                        endDate: DateTime.fromISO(e.target.value).endOf('day').toMillis()
                    })}
                />
            </Col>
            {
                datesDefault === "empty" &&
                <Col>
                    <Button
                        startIcon={<FontAwesomeIcon icon={faCalendarXmark} />}
                        title={'limpiar'}
                        onClick={handleSelectDateByDefault}
                    />

                </Col>
            }
            {
                dateOptionsMenu &&
                <DateRangeFilter
                    setDates={setDates}
                    dates={dates}
                />
            }
        </Container>
    )
}

// ... (Estilos no modificados)
const InputDate = styled.input`
    padding: 0.1em 0.2em;
    border: none;

    border-radius: 4px;
    background-color: var(--White2);
    color: rgb(92, 92, 92);
    transition: all 0.5s ease-in-out;
    &::placeholder{
        color: transparent;
    }
    &:focus{
        outline:  1px solid  #1155e7;
    }
    &::-webkit-datetime-edit {
        padding: 0.2em 0.4em;
    }
    &::-webkit-datetime-edit-fields-wrapper {
    }
    &::-webkit-calendar-picker-indicator {
      
    }

  @media (max-width: 800px) {
    &::-webkit-inner-spin-button,
    &::-webkit-calendar-picker-indicator {
        width: calc(100% + 2em);
       
       
        height: 100%;
        position: absolute;
        top: 0;
        left: -2em;
    }
    position: relative;
    margin: 0;
    ${props => props.inputMovilWidth ? `
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
    ` : `
        width: 2em !important;
        min-width: 7.4em !important;
        max-width: 7.4em !important;
        
        `}
  }

`

const Container = styled.div`
    display: grid;  
    grid-template-columns: min-content min-content min-content;
    gap: 0.4em;
   
`

const Label = styled.label`
    line-height: 14px;
    font-size: 13px;
    color: var(--Gray5);
`
const Col = styled.div`
    display: flex;
    justify-content: end;
    flex-direction: column;
    gap: 0.2em;
    
`
const Buttons = styled.div`
    display: flex;
    flex-wrap: wrap;
`