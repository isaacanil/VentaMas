import React, { forwardRef, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

import Calendar from './components/Calendar';
import { useDatePicker } from './hooks/useDatePicker';
import { formatDate, toDateTime } from './utils/dateUtils';

/**
 * Componente DateRangePicker que muestra ambas fechas en un único campo
 * con pestañas para seleccionar entre fecha inicial y final
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.value - Objeto con valores {start, end}
 * @param {Function} props.onChange - Función a ejecutar al cambiar el rango
 * @param {string} props.format - Formato de fecha (usando luxon)
 * @param {Function} props.disableDates - Función para deshabilitar fechas
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.disabled - Deshabilita el selector
 * @param {string} props.className - Clases CSS adicionales
 */
const DateRangePicker = forwardRef(({
  value = { start: null, end: null },
  onChange,
  format = 'dd/MM/yy', // Formato compacto por defecto
  disableDates,
  placeholder = 'Seleccionar rango de fechas',
  disabled = false,
  className,
  ...props
}, ref) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const mergedRef = ref || inputRef;
  
  // Estado interno del componente
  const [dateRange, setDateRange] = useState({
    start: value.start || null,
    end: value.end || null
  });
  const [activeTab, setActiveTab] = useState('start'); // 'start' o 'end'
  const [isOpen, setIsOpen] = useState(false);
  
  // Hook para el calendario de fecha inicial
  const startDatePicker = useDatePicker({
    initialValue: dateRange.start,
    onChange: (date) => handleStartDateSelection(date)
  });
  
  // Hook para el calendario de fecha final
  const endDatePicker = useDatePicker({
    initialValue: dateRange.end,
    onChange: (date) => handleEndDateSelection(date)
  });
  
  // Actualiza el estado interno cuando cambian las props
  useEffect(() => {
    setDateRange({
      start: value.start || null,
      end: value.end || null
    });
  }, [value]);
  
  // Maneja la selección de fecha inicial
  const handleStartDateSelection = (date) => {
    let newRange = { ...dateRange, start: date };
    
    // Si la fecha inicio es posterior a la fecha fin, reseteamos la fecha fin
    if (dateRange.end && date > dateRange.end) {
      newRange.end = null;
    }
    
    setDateRange(newRange);
    
    // Cambiar automáticamente a la pestaña de fecha fin si se ha seleccionado una fecha inicio
    if (!dateRange.end) {
      setActiveTab('end');
    }
    
    if (onChange) {
      onChange(newRange);
    }
  };
  
  // Maneja la selección de fecha final
  const handleEndDateSelection = (date) => {
    // Verificar que la fecha final no sea anterior a la inicial
    if (dateRange.start && date < dateRange.start) {
      return; // No permitimos seleccionar una fecha fin anterior a la fecha inicio
    }
    
    const newRange = { ...dateRange, end: date };
    setDateRange(newRange);
    
    // Si se han seleccionado ambas fechas, cerramos el calendario
    if (dateRange.start && date) {
      setTimeout(() => closeCalendar(), 300); // Pequeño delay para que se vea la selección
    }
    
    if (onChange) {
      onChange(newRange);
    }
  };
  
  // Formatea el rango de fechas para mostrar en el input
  const getDisplayValue = () => {
    if (!dateRange.start && !dateRange.end) return '';
    
    const startStr = dateRange.start ? formatDate(dateRange.start, format) : '?';
    const endStr = dateRange.end ? formatDate(dateRange.end, format) : '?';
    
    return `${startStr} - ${endStr}`;
  };
  
  // Abre el calendario
  const openCalendar = () => {
    if (disabled) return;
    setIsOpen(true);
  };
  
  // Cierra el calendario
  const closeCalendar = () => {
    setIsOpen(false);
  };
  
  // Resetea la selección del rango
  const resetSelection = (e) => {
    e.stopPropagation();
    setDateRange({ start: null, end: null });
    if (onChange) {
      onChange({ start: null, end: null });
    }
  };
  
  // Maneja clics fuera del componente para cerrar el calendario
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
  }, [isOpen]);
  
  // Maneja teclas para cerrar el calendario
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
  }, [isOpen]);
  
  // Función para deshabilitar fechas en el calendario de fecha final
  const disableEndDates = (date) => {
    if (disableDates && disableDates(date)) {
      return true;
    }
    
    // Deshabilitar fechas anteriores a la fecha de inicio
    if (dateRange.start) {
      const startDate = toDateTime(dateRange.start);
      return date < startDate.toJSDate();
    }
    
    return false;
  };
  
  return (
    <Container ref={containerRef} className={className}>
      <InputContainer onClick={openCalendar}>
        <StyledInput
          ref={mergedRef}
          value={getDisplayValue()}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          {...props}
        />
        <CalendarIcon disabled={disabled}>
          <BiCalendarAlt />
        </CalendarIcon>
        
        {(dateRange.start || dateRange.end) && (
          <ClearButton onClick={resetSelection} disabled={disabled}>×</ClearButton>
        )}
      </InputContainer>
      
      {isOpen && !disabled && (
        <CalendarContainer>
          <TabContainer>
            <Tab 
              active={activeTab === 'start'} 
              onClick={() => setActiveTab('start')}
            >
              <TabText>Fecha inicial</TabText>
              {dateRange.start && (
                <TabDate>{formatDate(dateRange.start, format)}</TabDate>
              )}
            </Tab>
            <Tab 
              active={activeTab === 'end'} 
              onClick={() => setActiveTab('end')}
              disabled={!dateRange.start}
            >
              <TabText>Fecha final</TabText>
              {dateRange.end && (
                <TabDate>{formatDate(dateRange.end, format)}</TabDate>
              )}
            </Tab>
          </TabContainer>
          
          {activeTab === 'start' ? (
            <Calendar
              currentViewDate={startDatePicker.currentViewDate}
              selectedDate={startDatePicker.selectedDate}
              calendarDays={startDatePicker.calendarDays}
              onSelectDate={startDatePicker.selectDate}
              goToPreviousMonth={startDatePicker.goToPreviousMonth}
              goToNextMonth={startDatePicker.goToNextMonth}
              goToPreviousYear={startDatePicker.goToPreviousYear}
              goToNextYear={startDatePicker.goToNextYear}
              goToCurrentMonth={startDatePicker.goToCurrentMonth}
              disableDates={disableDates}
            />
          ) : (
            <Calendar
              currentViewDate={endDatePicker.currentViewDate}
              selectedDate={endDatePicker.selectedDate}
              calendarDays={endDatePicker.calendarDays}
              onSelectDate={endDatePicker.selectDate}
              goToPreviousMonth={endDatePicker.goToPreviousMonth}
              goToNextMonth={endDatePicker.goToNextMonth}
              goToPreviousYear={endDatePicker.goToPreviousYear}
              goToNextYear={endDatePicker.goToNextYear}
              goToCurrentMonth={endDatePicker.goToCurrentMonth}
              disableDates={disableEndDates}
            />
          )}
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
  padding: 0 52px 0 12px; /* Padding extra a la derecha para los iconos */
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
  right: 28px; /* Posicionado para dejar espacio al botón de limpiar */
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

// Botón para limpiar la selección
const ClearButton = styled.button`
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: #999;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
  
  &:hover {
    color: #666;
  }
  
  &:disabled {
    color: #d9d9d9;
    cursor: not-allowed;
  }
`;

// Contenedor para las pestañas
const TabContainer = styled.div`
  display: flex;
  width: 100%;
  border-bottom: 1px solid #e8e8e8;
`;

// Estilo para cada pestaña
const Tab = styled.div`
  flex: 1;
  text-align: center;
  padding: 10px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  background-color: ${props => props.active ? '#fff' : '#f5f7fa'};
  border-bottom: 2px solid ${props => props.active ? '#2772e4' : 'transparent'};
  transition: all 0.3s;
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover {
    background-color: ${props => !props.disabled && !props.active ? '#f0f0f0' : ''};
  }
`;

// Texto de la pestaña
const TabText = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
`;

// Fecha seleccionada en la pestaña
const TabDate = styled.div`
  font-size: 0.75rem;
  color: #2772e4;
  margin-top: 4px;
`;

// Estilo para el contenedor del calendario
const CalendarContainer = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 300px;
  z-index: 1000;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  background-color: white;
  border-radius: var(--border-radius, 8px);
  overflow: hidden;
  animation: fadeIn 0.2s ease-in-out;
  
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

DateRangePicker.displayName = 'DateRangePicker';

// Explicitly export the component
export default DateRangePicker;
