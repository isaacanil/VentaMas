import { DateTime } from 'luxon';
import { useState, useCallback, useEffect } from 'react';

import { getMonthDays, getPreviousMonthDays, getNextMonthDays } from '../utils/dateUtils';

/**
 * Hook personalizado para manejar la lógica del DatePicker
 * @param {Object} options - Opciones de configuración
 * @param {DateTime|Date|string|number} options.initialValue - Valor inicial del DatePicker
 * @param {Function} options.onChange - Función a ejecutar cuando cambia la fecha seleccionada
 * @returns {Object} - Estado y funciones del DatePicker
 */
export const useDatePicker = ({ initialValue, onChange }) => {
  // Estado para la fecha actualmente seleccionada
  const [selectedDate, setSelectedDate] = useState(() => {
    return initialValue ? DateTime.fromJSDate(new Date(initialValue)) : null;
  });
  
  // Estado para la fecha que se está mostrando en el calendario (mes/año)
  const [currentViewDate, setCurrentViewDate] = useState(() => {
    return selectedDate || DateTime.now();
  });
  
  // Estado para controlar si el calendario está visible
  const [isOpen, setIsOpen] = useState(false);

  // Construir los días del calendario para el mes actual
  const calendarDays = useCallback(() => {
    const prevMonthDays = getPreviousMonthDays(currentViewDate);
    const currentMonthDays = getMonthDays(currentViewDate);
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const nextMonthDays = getNextMonthDays(currentViewDate, totalDays);
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentViewDate]);
  
  // Navegar al mes anterior
  const goToPreviousMonth = useCallback(() => {
    setCurrentViewDate(prev => prev.minus({ months: 1 }));
  }, []);
  
  // Navegar al mes siguiente
  const goToNextMonth = useCallback(() => {
    setCurrentViewDate(prev => prev.plus({ months: 1 }));
  }, []);
  
  // Navegar al año anterior
  const goToPreviousYear = useCallback(() => {
    setCurrentViewDate(prev => prev.minus({ years: 1 }));
  }, []);
  
  // Navegar al año siguiente
  const goToNextYear = useCallback(() => {
    setCurrentViewDate(prev => prev.plus({ years: 1 }));
  }, []);
  
  // Ir al mes actual
  const goToCurrentMonth = useCallback(() => {
    setCurrentViewDate(DateTime.now());
  }, []);
  
  // Seleccionar una fecha
  const selectDate = useCallback((date) => {
    setSelectedDate(date);
    setIsOpen(false);
    if (onChange) {
      onChange(date.toJSDate());
    }
  }, [onChange]);
  
  // Abrir el calendario
  const openCalendar = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  // Cerrar el calendario
  const closeCalendar = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  // Toggle del calendario
  const toggleCalendar = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  // Si se actualiza selectedDate externamente, actualizar también currentViewDate
  useEffect(() => {
    if (initialValue) {
      const newDate = DateTime.fromJSDate(new Date(initialValue));
      setSelectedDate(newDate);
      setCurrentViewDate(newDate);
    }
  }, [initialValue]);
  
  return {
    selectedDate,
    currentViewDate,
    isOpen,
    calendarDays: calendarDays(),
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousYear,
    goToNextYear,
    goToCurrentMonth,
    selectDate,
    openCalendar,
    closeCalendar,
    toggleCalendar
  };
};
