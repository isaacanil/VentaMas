import { useEffect, useState } from "react";
import styled from "styled-components"
import { DateTime } from "luxon";
const getDefaultDate = () => {
    const today = DateTime.local().startOf('day');
    const startDate = today.toMillis();
    const endDate = DateTime.local().endOf('day').toMillis();
    return { startDate, endDate };
}
const setTimeMorning = (date) => {
    return DateTime.fromISO(date).set({ hour: 4 }).toMillis();
  }
const setTimeNight = (date) => {
    return DateTime.fromISO(date).set({ hour: 23, minute: 59, second: 59 }).toMillis();
}
export const DatePicker = ({ dates, data }) => {
    // Me tra el dia de hoy 
    const getDefaultValue = getDefaultDate();
    const [datesSelected, setDates] = useState(getDefaultValue);

    useEffect(() => {
        dates(datesSelected);
    }, [datesSelected]);
    useEffect(() => {
        setDates(getDefaultValue);
    }, []);
    useEffect(() => {
        if(data.startDate && data.endDate){
            setDates(data);
        }
    }, [data])

    return (
        <Container>
            <Group>
                <Col>
                    <Label>Fecha Inicio</Label>
                    <input
                        value={DateTime.fromMillis(datesSelected.startDate).toISODate()}
                        type="date"
                        name="startDate"
                        onChange={(e) => setDates({ ...datesSelected, startDate: setTimeMorning(e.target.value) })}
                    />
                </Col>
                <Col>
                    <Label>Fecha Fin</Label>
                    <input
                        value={DateTime.fromMillis(datesSelected.endDate).toISODate()}
                        min={DateTime.fromMillis(datesSelected.startDate).toISODate()}
                        max={DateTime.local().toISODate()}
                        type="date"
                        name="endDate"
                        onChange={(e) => setDates({ ...datesSelected, endDate: setTimeNight(e.target.value) })}
                    />
                </Col>
            </Group>
        </Container>
    )
}

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
    flex-direction: column;
    gap: 0.2em;
    
`
