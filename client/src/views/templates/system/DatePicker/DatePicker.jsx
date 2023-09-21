import { useEffect, useState } from "react";
import styled from "styled-components"
import { DateTime } from "luxon";
import { Button } from "../Button/Button";
import { icons } from "../../../../constants/icons/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarXmark } from "@fortawesome/free-solid-svg-icons";

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

export const DatePicker = ({ setDates, dates, datesDefault = "today" }) => {
    const [currentDates, setCurrentDates] = useState(getDefaultDates());
    const handleSelectDateByDefault = () => {
        if (datesDefault === "today") {setCurrentDates(getDefaultDates());}
        if (datesDefault === "empty") {setCurrentDates(getEmptyDates());} 
        
    }

    useEffect(() => {
        if (datesDefault === "today") {
            if (!dates.startDate || !dates.endDate) {
                setCurrentDates(getDefaultDates());
            
            } else {
                setCurrentDates(dates);
            }
        }
        if (datesDefault === "empty") {
            if (!dates.startDate || !dates.endDate) {
                setCurrentDates(getEmptyDates());
            } else {
                setCurrentDates(dates);
            }
        }
    }, []);

    // useEffect para actualizar dates basado en currentDates
    useEffect(() => {
        setDates(currentDates);
    }, [currentDates]);

    return (
        <Container>
            <Group>
                <Col>
                    <Label>Fecha Inicio</Label>
                    <input
                        value={currentDates.startDate ? DateTime.fromMillis(currentDates.startDate).toISODate() : ""}
                        max={currentDates.endDate ? DateTime.fromMillis(currentDates.endDate).toISODate() : undefined}
                        type="date"
                        name="startDate"
                        onChange={(e) => setCurrentDates({
                            ...currentDates,
                            startDate: DateTime.fromISO(e.target.value).startOf('day').toMillis()
                        })}
                    />
                </Col>
                <Col>
                    <Label>Fecha Fin</Label>
                    <input
                        value={currentDates.endDate ? DateTime.fromMillis(currentDates.endDate).toISODate() : ""}
                        min={currentDates.startDate ? DateTime.fromMillis(currentDates.startDate).toISODate() : undefined}
                        max={DateTime.local().toISODate()}
                        type="date"
                        name="endDate"
                        onChange={(e) => setCurrentDates({
                            ...currentDates,
                            endDate: DateTime.fromISO(e.target.value).endOf('day').toMillis()
                        })}
                    />
                </Col>
                <Col>
                    <Button
                        startIcon={<FontAwesomeIcon icon={faCalendarXmark} />}
                        title={'limpiar'}
                        onClick={handleSelectDateByDefault}
                    />

                </Col>
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
