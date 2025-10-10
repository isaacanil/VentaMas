import { DateTime } from 'luxon';
import React from 'react';
import styled from 'styled-components';

import { isSameDay } from '../utils/dateUtils';

/**
 * Componente que representa un día en el calendario
 */
const Day = ({ dayInfo, selectedDate, onSelect, disabled }) => {
  const { day, date, isCurrentMonth } = dayInfo;
  const isToday = isSameDay(date, DateTime.now());
  const isSelected = selectedDate && isSameDay(date, selectedDate);
  
  const handleClick = () => {
    if (!disabled) {
      onSelect(date);
    }
  };

  return (
    <StyledDay 
      isCurrentMonth={isCurrentMonth}
      isSelected={isSelected}
      isToday={isToday}
      disabled={disabled}
      onClick={handleClick}
    >
      {day}
    </StyledDay>
  );
};

const StyledDay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  user-select: none;
  font-size: 0.875rem;
  transition: background-color 0.2s, color 0.2s;
  
  /* Estilos para día actual */
  ${props => props.isToday && `
    border: 1px solid #2772e4;
    font-weight: 600;
  `}
  
  /* Estilos para día seleccionado */
  ${props => props.isSelected && `
    background-color: #2772e4;
    color: white;
    font-weight: 600;
  `}
  
  /* Estilos para días que no son del mes actual */
  ${props => !props.isCurrentMonth && `
    opacity: 0.4;
  `}
  
  /* Estilos para hover */
  &:hover {
    ${props => !props.isSelected && !props.disabled && `
      background-color: #e6f0ff;
    `}
  }
  
  /* Estilos para días deshabilitados */
  ${props => props.disabled && `
    opacity: 0.3;
    cursor: not-allowed;
    &:hover {
      background-color: transparent;
    }
  `}
`;

export default Day;
