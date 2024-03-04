import { useEffect, useState } from "react";
import styled from "styled-components"
import { DateTime } from "luxon";
import { Button } from "../../Button/Button";
import { icons } from "../../../../../constants/icons/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarXmark } from "@fortawesome/free-solid-svg-icons";
import {DateRangeFilter} from "../../Button/TimeFilterButton/DateRangeFilter";
import { getDateRange } from "../../../../../utils/date/getDateRange";
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
    dateOptionsMenu = false
}) => {

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
            <Group>
                <Col>
                    <Label>Fecha Inicio</Label>
                    <input
                        value={dates.startDate ? DateTime.fromMillis(dates.startDate).toISODate() : ""}
                        max={dates.endDate ? DateTime.fromMillis(dates.endDate).toISODate() : null}
                        type="date"
                        name="startDate"
                        onChange={(e) => setDates({
                            ...dates,
                            startDate: DateTime.fromISO(e.target.value).startOf('day').toMillis()
                        })}
                    />
                </Col>
                <Col>
                    <Label>Fecha Fin</Label>
                    <input
                        value={dates.endDate ? DateTime.fromMillis(dates.endDate).toISODate() : ""}
                        min={dates.startDate ? DateTime.fromMillis(dates.startDate).toISODate() : null}
                        max={DateTime.local().toISODate()}
                        type="date"
                        name="endDate"
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
            </Group>
        </Container>
    )
}

// ... (Estilos no modificados)


const Container = styled.div`

    input[type="date"]{
        
        padding: 0.1em 0.2em;
        border: none;
        width: 10em;
        border-radius: 4px;
        background-color: var(--White2);
        color: rgb(92, 92, 92);
        transition: all 0.5s ease-in-out;
        &::placeholder{
            color: transparent;
        }
        &:focus{
            outline:  2px solid  #1155e7;
        }
        &::-webkit-datetime-edit { 
           padding: 0.2em 0.4em;
        }
        &::-webkit-datetime-edit-fields-wrapper { 
             
        }
       
       
       
        &::-webkit-calendar-picker-indicator { 
           margin-left: 1em;
        }
    }
`
const Group = styled.div`
    display: flex;
    gap: 1em;
    align-items: end;
    
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
