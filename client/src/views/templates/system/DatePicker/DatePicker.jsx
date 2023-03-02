import { useEffect, useState } from "react";
import styled from "styled-components"

const getDefaultDate = () => {

  let r = Date.now()
  let today = new Date(r)
  today.setHours(0)
  const startDate = today.setHours(0, 0, 0, 0)
  const endDate = Date.now()
  return {startDate, endDate}
}

const getDateToTimeStamp = (startDate, endDate) => {
    const date = new Date()
    let hour = date.getHours();
    let minute = date.getMinutes();
    let seconds = date.getSeconds();
    const startDateToTime = new Date(`${startDate}`).setHours(0) / 1000;
    const endDateToTime = new Date(`${endDate}`).setHours(hour, minute ,seconds ) / 1000;
    console.log(new Date(startDateToTime))
    return {startDateToTime, endDateToTime}
}

export const DatePicker = ({dates}) => {
    //Me tra el dia de hoy 
    const getDefaultValue = getDefaultDate()
    const [datesSelected, setDates] = useState(getDefaultValue)

    console.log(datesSelected)

    useEffect(() => {
        dates(datesSelected)  
    }, [datesSelected])
  const setTimeMorning = (date) => {
    const r = new Date(date)
    r.setUTCHours(4)
    r.getTime()
    return r
  }
 const setTimeNight = (date) =>{
     const r = new Date(date)
     r.setUTCHours(27, 59, 55)
     r.getTime()
     console.log('final', date, r)
    return r
 }
    return (
        <Container>
            <Group>
                <Col>
                    <Label>Fecha Inicio</Label>
                    <input
                        value={new Date(datesSelected.startDate).toISOString().slice(0, 10)}
                        type="date"
                        name="startDate"
                        onChange={(e) => setDates({...datesSelected, startDate: setTimeMorning(e.target.value)})}
                    />
                </Col>
                <Col>
                    <Label>Fecha Fin</Label>
                    <input
                        value={new Date(datesSelected.endDate).toISOString().slice(0, 10)}
                        min={datesSelected.startDate}
                        max={new Date().toISOString().slice(0, 10) }
                        type="date"
                        name="endDate"
                        onChange={(e) => setDates({...datesSelected, endDate: setTimeNight(e.target.value)})}
                    />
                </Col>
            </Group>

        </Container>
    )
}
const Container = styled.div`
    padding: 0.2em 0;
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
`
const Col = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2em;
`
