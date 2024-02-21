import { DateTime } from "luxon";
import styled from "styled-components";
import { FormattedValue } from "../../../../../../templates/system/FormattedValue/FormattedValue";

export const DateSection = ({ date }) => {
    let currentDate;

    // Si date es una cadena, intentamos parsearla como un objeto JSON
    if (typeof date === 'string') {
        try {
            date = JSON.parse(date);
        } catch (error) {
            console.error("Error parsing date string:", error);
        }
    }
    console.log(date)

    // Si date es un número, asumimos que es una fecha en milisegundos
    // y la convertimos a un objeto DateTime de Luxon
    if (typeof date === 'number') {
        currentDate = DateTime.fromMillis(date);
    }

    // Formateamos la fecha y la hora
    const formattedDate = currentDate ? currentDate.toLocaleString(DateTime.DATE_SHORT) : '';
    const formattedTime = currentDate ? currentDate.toFormat('hh:mm a') : '';


    return (
        date && (
            currentDate && (
                <Container>
                    <DateContainer>
                        <span>
                            {formattedDate}
                        </span>
                        <span>
                            {formattedTime}
                        </span>
                    </DateContainer>
                </Container>
        ))
    )
}
const Container = styled.div`

//border-radius: var(--border-radius);
//background-color: var(--White);
//border: 1px solid rgba(0, 0, 0, 0.150);
//padding: 0.1em 0.6em;
//display: flex;
//align-items: center;
//align-content: center;
//justify-content: space-between;
`
const DateContainer = styled.div`
display: flex;
gap: 1em;
align-items: center;
grid-template-columns: 1fr 1fr;
flex-wrap: nowrap;
font-size: 14px;



`
