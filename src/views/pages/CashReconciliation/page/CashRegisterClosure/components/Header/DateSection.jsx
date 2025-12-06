import { DateTime } from 'luxon';
import styled from 'styled-components';

export const DateSection = ({ date }) => {
  let currentDate;

  // Si date es una cadena, intentamos parsearla como un objeto JSON
  if (typeof date === 'string') {
    try {
      date = JSON.parse(date);
    } catch (error) {
      console.error('Error parsing date string:', error);
    }
  }

  // Si date es un número, asumimos que es una fecha en milisegundos
  // y la convertimos a un objeto DateTime de Luxon
  if (typeof date === 'number') {
    currentDate = DateTime.fromMillis(date);
  }

  // Formateamos la fecha y la hora
  const formattedDate = currentDate
    ? currentDate.toLocaleString(DateTime.DATE_SHORT)
    : '';
  const formattedTime = currentDate ? currentDate.toFormat('hh:mm a') : '';

  return (
    date &&
    currentDate && (
      <Container>
        <DateContainer>
          <span>{formattedDate}</span>
          <span>{formattedTime}</span>
        </DateContainer>
      </Container>
    )
  );
};
const Container = styled.div``;
const DateContainer = styled.div`
  display: flex;
  flex-wrap: nowrap;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
  align-items: center;
  font-size: 14px;
`;
