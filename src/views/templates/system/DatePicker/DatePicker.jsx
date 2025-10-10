import React, { forwardRef, useRef, useEffect } from 'react';
import styled from 'styled-components';

import Calendar from './components/Calendar';
import { useDatePicker } from './hooks/useDatePicker';
import { formatDate } from './utils/dateUtils';

/**
 * Componente DatePicker personalizado
 * @param {Object} props - Propiedades del componente
 * @param {Date|string|number} props.value - Valor seleccionado
 * @param {Function} props.onChange - Función a ejecutar al seleccionar una fecha
 * @param {string} props.format - Formato de fecha a mostrar (usando luxon)
 * @param {Function} props.disableDates - Función para deshabilitar fechas específicas
 * @param {string} props.placeholder - Placeholder para el input
 * @param {boolean} props.disabled - Deshabilita el datepicker
 * @param {boolean} props.readOnly - Hace el input de solo lectura
 * @param {string} props.className - Clases CSS adicionales
 */
const DatePicker = forwardRef(({
  value,
  onChange,
  format = 'dd/MM/yyyy',
  disableDates,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  readOnly = false,
  className,
  ...props
}, ref) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const mergedRef = ref || inputRef;
  
  const {
    selectedDate,
    currentViewDate,
    isOpen,
    calendarDays,
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousYear,
    goToNextYear,
    goToCurrentMonth,
    selectDate,
    toggleCalendar,
    closeCalendar
  } = useDatePicker({
    initialValue: value,
    onChange
  });
  
  // Cerrar calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        closeCalendar();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeCalendar]);
  
  // Manejar teclas de navegación
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeCalendar();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeCalendar]);
  
  return (
    <Container 
      ref={containerRef} 
      className={className}
    >
      <InputContainer onClick={!disabled ? toggleCalendar : undefined}>
        <StyledInput 
          ref={mergedRef}
          value={selectedDate ? formatDate(selectedDate, format) : ''}
          placeholder={placeholder}
          readOnly={true}
          disabled={disabled}
          {...props}
        />
        <CalendarIcon disabled={disabled}>
          <BiCalendarAlt />
        </CalendarIcon>
      </InputContainer>
      
      {isOpen && !disabled && (
        <CalendarContainer>
          <Calendar 
            currentViewDate={currentViewDate}
            selectedDate={selectedDate}
            calendarDays={calendarDays}
            onSelectDate={selectDate}
            goToPreviousMonth={goToPreviousMonth}
            goToNextMonth={goToNextMonth}
            goToPreviousYear={goToPreviousYear}
            goToNextYear={goToNextYear}
            goToCurrentMonth={goToCurrentMonth}
            disableDates={disableDates}
          />
        </CalendarContainer>
      )}
    </Container>
  );
});

// Estilo para el contenedor principal
const Container = styled.div`
  position: relative;
  width: 100%;
  display: inline-block;
`;

// Estilo para el contenedor del input
const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
`;

// Estilo para el input
const StyledInput = styled.input`
  width: 100%;
  height: 32px;
  padding: 0 32px 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: var(--border-radius, 4px);
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    border-color: #2772e4;
  }
  
  &:focus {
    border-color: #2772e4;
    box-shadow: 0 0 0 2px rgba(39, 114, 228, 0.2);
    outline: none;
  }
  
  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    color: rgba(0, 0, 0, 0.25);
    border-color: #d9d9d9;
  }
`;

// Estilo para el icono del calendario
const CalendarIcon = styled.span`
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.disabled ? '#d9d9d9' : '#666'};
  pointer-events: none;
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: rgba(39, 114, 228, 0.08);
    z-index: -1;
    transform: scale(0);
    transition: transform 0.2s ease;
  }
  
  ${InputContainer}:hover &::after {
    transform: scale(1);
  }
`;

// Estilo para el contenedor del calendario
const CalendarContainer = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 300px;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in-out;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  background-color: white;
  border-radius: var(--border-radius, 8px);
  overflow: hidden;
  
  @media (max-width: 768px) {
    position: fixed;
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    border-radius: var(--border-radius, 8px) var(--border-radius, 8px) 0 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    max-height: 80vh;
    overflow-y: auto;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
`;

DatePicker.displayName = 'DatePicker';

export default DatePicker;
