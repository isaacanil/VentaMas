import React, { useState, useEffect, useRef } from 'react';
import { Input, Popover } from 'antd';
import { CalendarOutlined, CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export const DatePicker = ({
    mode = 'single', // 'single' | 'range'
    value,
    onChange,
    placeholder = 'Seleccionar fecha',
    format = 'DD/MM/YYYY',
    allowClear = true,
    size = 'middle',
    disabled = false,
    presets = [],
    className,
    style,
    ...props
}) => {
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [hoverDate, setHoverDate] = useState(null);
    const [rangeStart, setRangeStart] = useState(null);
    const containerRef = useRef(null);

    // Detectar si es móvil
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Sincronizar currentDate con el valor seleccionado
    useEffect(() => {
        if (value) {
            if (mode === 'range' && Array.isArray(value) && value[0]) {
                setCurrentDate(value[0]);
            } else if (mode === 'single' && value) {
                setCurrentDate(value);
            }
        }
    }, [value, mode]);

    // Presets por defecto
    const defaultPresets = [
        {
            label: 'Hoy',
            value: mode === 'range' 
                ? [dayjs().startOf('day'), dayjs().endOf('day')]
                : dayjs().startOf('day')
        },
        {
            label: 'Ayer',
            value: mode === 'range'
                ? [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')]
                : dayjs().subtract(1, 'day').startOf('day')
        },
        {
            label: 'Esta semana',
            value: mode === 'range'
                ? [dayjs().startOf('week'), dayjs().endOf('week')]
                : dayjs().startOf('week')
        },
        {
            label: 'Este mes',
            value: mode === 'range'
                ? [dayjs().startOf('month'), dayjs().endOf('month')]
                : dayjs().startOf('month')
        },
        {
            label: 'Este año',
            value: mode === 'range'
                ? [dayjs().startOf('year'), dayjs().endOf('year')]
                : dayjs().startOf('year')
        },
        {
            label: 'Últimos 7 días',
            value: mode === 'range'
                ? [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')]
                : dayjs().subtract(6, 'day').startOf('day')
        },
        {
            label: 'Últimos 30 días',
            value: mode === 'range'
                ? [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')]
                : dayjs().subtract(29, 'day').startOf('day')
        }
    ];

    const finalPresets = presets.length > 0 ? presets : defaultPresets;

    const handlePresetClick = (preset) => {
        onChange(preset.value);
        setRangeStart(null);
        if (!isMobile) {
            setOpen(false);
        }
    };

    const handleClear = (e) => {
        if (e) {
            e.stopPropagation();
        }
        onChange(null);
        setRangeStart(null);
        // No cerrar automáticamente para permitir nueva selección
        // setOpen(false);
    };

    const handleDateClick = (date) => {
        if (mode === 'single') {
            onChange(date);
            // El popover/modal se cerrará con el botón Confirmar
        } else {
            // Range mode
            if (!rangeStart || (rangeStart && value && value[1])) {
                // Start new range
                setRangeStart(date);
                onChange([date, null]);
            } else {
                // Complete range
                const start = rangeStart.isBefore(date) ? rangeStart : date;
                const end = rangeStart.isBefore(date) ? date : rangeStart;
                onChange([start, end]);
                setRangeStart(null);
            }
        }
    };

    const formatDisplayValue = (val) => {
        if (!val) return '';
        
        if (mode === 'range' && Array.isArray(val)) {
            if (val[0] && dayjs.isDayjs(val[0]) && val[1] && dayjs.isDayjs(val[1])) {
                return `${val[0].format(format)} - ${val[1].format(format)}`;
            } else if (val[0] && dayjs.isDayjs(val[0])) {
                return `${val[0].format(format)} - ...`;
            }
            return '';
        }
        
        return val && dayjs.isDayjs(val) && val.format ? val.format(format) : '';
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => 
            direction === 'prev' 
                ? prev.subtract(1, 'month')
                : prev.add(1, 'month')
        );
    };

    const isDateInRange = (date) => {
        if (!date || !dayjs.isDayjs(date)) return false;
        if (mode !== 'range') return false;

        const start = currentRangeStart;
        const end = currentRangeEnd;

        if (!start) return false;

        const effectiveEnd = end || hoverDate;

        if (!effectiveEnd) {
            return date.isSame(start, 'day');
        }

        const s = start.isBefore(effectiveEnd) ? start : effectiveEnd;
        const e = start.isBefore(effectiveEnd) ? effectiveEnd : start;
        return date.isSameOrAfter(s, 'day') && date.isSameOrBefore(e, 'day');
    };

    const isDateSelected = (date) => {
        if (!date || !dayjs.isDayjs(date)) return false;
        
        if (mode === 'single') {
            return value && dayjs.isDayjs(value) && date.isSame(value, 'day');
        }
        // range
        return (currentRangeStart && date.isSame(currentRangeStart, 'day')) ||
               (currentRangeEnd && date.isSame(currentRangeEnd, 'day'));
    };

    const isDateRangeStart = (date) => {
        if (!date || !dayjs.isDayjs(date)) return false;
        return mode === 'range' && currentRangeStart && date.isSame(currentRangeStart, 'day');
    };

    const isDateRangeEnd = (date) => {
        if (!date || !dayjs.isDayjs(date)) return false;
        return mode === 'range' && currentRangeEnd && date.isSame(currentRangeEnd, 'day');
    };

    const renderCalendarGrid = () => {
        const startOfMonth = currentDate.startOf('month');
        const endOfMonth = currentDate.endOf('month');
        const startOfWeek = startOfMonth.startOf('week');
        const endOfWeek = endOfMonth.endOf('week');
        
        const days = [];
        let day = startOfWeek;
        
        while (day.isBefore(endOfWeek) || day.isSame(endOfWeek, 'day')) {
            days.push(day);
            day = day.add(1, 'day');
        }
        
        return days;
    };

    const renderContent = () => (
        <StyledDatePickerContent $isMobile={isMobile}>
            {/* Presets */}
            <PresetsSection>
                <PresetsGrid $isMobile={isMobile}>
                    {finalPresets.map((preset, index) => {
                        let isActive = false;
                        if (value) {
                          if (mode === 'single' && dayjs.isDayjs(value)) {
                            isActive = dayjs(value).isSame(preset.value, 'day');
                          } else if (
                            mode === 'range' &&
                            Array.isArray(value) &&
                            Array.isArray(preset.value) &&
                            value[0] && value[1]
                          ) {
                            const [vStart, vEnd] = value;
                            const [pStart, pEnd] = preset.value;
                            if (pStart && pEnd) {
                              isActive = vStart.isSame(pStart, 'day') && vEnd.isSame(pEnd, 'day');
                            }
                          }
                        }
                        return (
                          <PresetButton
                            key={index}
                            $active={isActive}
                            onClick={() => handlePresetClick(preset)}
                          >
                            {preset.label}
                          </PresetButton>
                        );
                    })}
                </PresetsGrid>
            </PresetsSection>

            {/* Calendar */}
            <CalendarSection>
                <CalendarHeader>
                    <NavButton onClick={() => navigateMonth('prev')}>
                        <LeftOutlined />
                    </NavButton>
                    <MonthYear>
                        {currentDate.format('MMMM YYYY')}
                    </MonthYear>
                    <NavButton onClick={() => navigateMonth('next')}>
                        <RightOutlined />
                    </NavButton>
                </CalendarHeader>

                <WeekDaysHeader>
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                        <WeekDay key={day}>{day}</WeekDay>
                    ))}
                </WeekDaysHeader>

                <CalendarGrid>
                    {renderCalendarGrid().map((date, index) => {
                        const isCurrentMonth = date.month() === currentDate.month();
                        const isToday = date.isSame(dayjs(), 'day');
                        const isSelected = mode === 'single'
                            ? (value && dayjs.isDayjs(value) && date.isSame(value, 'day'))
                            : (currentRangeStart && date.isSame(currentRangeStart, 'day')) || (currentRangeEnd && date.isSame(currentRangeEnd, 'day'));

                        let isInRange = false;
                        if (mode === 'range') {
                            if (currentRangeStart && (currentRangeEnd || hoverDate)) {
                                const start = currentRangeStart;
                                const end = currentRangeEnd || hoverDate;
                                const s = start.isBefore(end) ? start : end;
                                const e = start.isBefore(end) ? end : start;
                                isInRange = date.isSameOrAfter(s, 'day') && date.isSameOrBefore(e, 'day');
                            }
                        }

                        const isRangeStart = mode === 'range' && currentRangeStart && date.isSame(currentRangeStart, 'day');
                        const isRangeEnd = mode === 'range' && currentRangeEnd && date.isSame(currentRangeEnd, 'day');

                        return (
                            <CalendarDay
                                key={index}
                                onClick={() => handleDateClick(date)}
                                $isCurrentMonth={isCurrentMonth}
                                $isToday={isToday}
                                $isSelected={isSelected}
                                $isInRange={isInRange}
                                $isRangeStart={isRangeStart}
                                $isRangeEnd={isRangeEnd}
                                onMouseEnter={() => mode === 'range' && setHoverDate(date)}
                                onMouseLeave={() => mode === 'range' && setHoverDate(null)}
                            >
                                {date.date()}
                            </CalendarDay>
                        );
                    })}
                </CalendarGrid>
            </CalendarSection>

            {/* Actions (siempre visibles) */}
            <ActionsSection>
                {allowClear && (
                    <ActionButton $secondary onClick={handleClear}>
                        Limpiar
                    </ActionButton>
                )}
                <ActionButton $primary onClick={() => {
                    setOpen(false);
                }}>
                    Confirmar
                </ActionButton>
            </ActionsSection>
        </StyledDatePickerContent>
    );

    // Calcular valor a mostrar en el input
    let inputValue = '';
    if (mode === 'range') {
        if (value && Array.isArray(value) && value[0]) {
            if (value[1]) {
                inputValue = `${value[0].format(format)} - ${value[1].format(format)}`;
            } else {
                inputValue = `${value[0].format(format)} - ...`;
            }
        } else if (rangeStart) {
            inputValue = `${rangeStart.format(format)} - ...`;
        }
    } else {
        inputValue = value && dayjs.isDayjs(value) ? value.format(format) : '';
    }
    const hasValue = inputValue !== '';

    // Helpers para range actual (valor prop + selección en progreso)
    const getCurrentRangeStart = () => {
        if (mode !== 'range') return null;
        if (value && Array.isArray(value) && value[0]) return value[0];
        return rangeStart;
    };

    const getCurrentRangeEnd = () => {
        if (mode !== 'range') return null;
        if (value && Array.isArray(value) && value[1]) return value[1];
        return null;
    };

    const currentRangeStart = getCurrentRangeStart();
    const currentRangeEnd = getCurrentRangeEnd();

    if (isMobile) {
        return (
            <Container ref={containerRef} className={className} style={style}>
                <StyledInput
                    value={hasValue ? inputValue : ''}
                    placeholder={placeholder}
                    readOnly
                    onClick={() => !disabled && setOpen(true)}
                    size={size}
                    disabled={disabled}
                    prefix={<CalendarOutlined />}
                    suffix={
                        allowClear && hasValue ? (
                            <ClearIcon onClick={handleClear}>
                                <CloseOutlined />
                            </ClearIcon>
                        ) : null
                    }
                    $hasValue={hasValue}
                    {...props}
                />

                <MobileModal
                    $open={open}
                    onClick={() => setOpen(false)}
                >
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>
                                {mode === 'range' ? 'Seleccionar rango de fechas' : 'Seleccionar fecha'}
                            </ModalTitle>
                            <CloseButton onClick={() => setOpen(false)}>
                                <CloseOutlined />
                            </CloseButton>
                        </ModalHeader>
                        <ModalBody>
                            {renderContent()}
                        </ModalBody>
                    </ModalContent>
                </MobileModal>
            </Container>
        );
    }

    return (
        <Container ref={containerRef} className={className} style={style}>
            <Popover
                content={renderContent()}
                trigger="click"
                open={open}
                onOpenChange={setOpen}
                placement="bottomLeft"
                overlayClassName="custom-datepicker-popover"
                getPopupContainer={() => containerRef.current}
            >
                <StyledInput
                    value={hasValue ? inputValue : ''}
                    placeholder={placeholder}
                    readOnly
                    size={size}
                    disabled={disabled}
                    prefix={<CalendarOutlined />}
                    suffix={
                        allowClear && hasValue ? (
                            <ClearIcon onClick={handleClear}>
                                <CloseOutlined />
                            </ClearIcon>
                        ) : null
                    }
                    $hasValue={hasValue}
                    {...props}
                />
            </Popover>
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    position: relative;
    width: 100%;
`;

const StyledInput = styled(Input)`
    cursor: pointer;
    
    input {
        cursor: pointer !important;
        color: ${props => props.$hasValue ? 'inherit' : '#bfbfbf'} !important;
    }
    
    &:hover {
        border-color: #40a9ff;
    }
    
    &:focus-within {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
`;

const ClearIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #bfbfbf;
    color: white;
    cursor: pointer;
    font-size: 10px;
    transition: all 0.3s;
    
    &:hover {
        background: #8c8c8c;
    }
`;

const StyledDatePickerContent = styled.div`
    padding: ${props => props.$isMobile ? '1rem' : '12px'};
    min-width: ${props => props.$isMobile ? 'auto' : '320px'};
    max-width: ${props => props.$isMobile ? '100%' : '400px'};
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 12px;
    height: 100%;
    max-height: ${props => props.$isMobile ? '100%' : '500px'};
`;

const PresetsSection = styled.div`
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
`;

const PresetsGrid = styled.div`
    display: grid;
    grid-template-columns: ${props => 
        props.$isMobile 
            ? 'repeat(2, 1fr)' 
            : 'repeat(3, 1fr)'
    };
    gap: 8px;
    
    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }
`;

const PresetButton = styled.button`
    padding: 6px 12px;
    border: 1px solid ${({ $active }) => ($active ? '#1890ff' : '#d9d9d9')};
    border-radius: 4px;
    background: ${({ $active }) => ($active ? '#1890ff' : 'white')};
    color: ${({ $active }) => ($active ? 'white' : '#595959')};
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
        border-color: #1890ff;
        color: ${({ $active }) => ($active ? 'white' : '#1890ff')};
    }
    
    &:active {
        transform: translateY(1px);
    }
`;

const CalendarSection = styled.div`
    overflow-y: auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const CalendarHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
`;

const NavButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: #595959;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s;
    
    &:hover {
        background: #f5f5f5;
        color: #1890ff;
    }
`;

const MonthYear = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: #262626;
    text-transform: capitalize;
`;

const WeekDaysHeader = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 4px;
`;

const WeekDay = styled.div`
    padding: 8px 4px;
    text-align: center;
    font-size: 12px;
    color: #8c8c8c;
    font-weight: 500;
`;

const CalendarGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
`;

const CalendarDay = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    font-size: 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s;
    position: relative;
    
    color: ${props => {
        if (!props.$isCurrentMonth) return '#bfbfbf';
        if (props.$isSelected) return 'white';
        if (props.$isToday) return '#1890ff';
        return '#262626';
    }};
    
    background: ${props => {
        if (props.$isSelected) return '#1890ff';
        if (props.$isInRange && !props.$isSelected) return '#e6f7ff';
        return 'transparent';
    }};
    
    font-weight: ${props => {
        if (props.$isSelected || props.$isToday) return '500';
        return '400';
    }};
    
    ${props => props.$isRangeStart && `
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    `}
    
    ${props => props.$isRangeEnd && `
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    `}
    
    ${props => props.$isInRange && !props.$isRangeStart && !props.$isRangeEnd && `
        border-radius: 0;
    `}
    
    &:hover {
        ${props => !props.$isSelected && `
            background: #f5f5f5;
            color: #1890ff;
        `}
    }
    
    ${props => props.$isToday && !props.$isSelected && `
        border: 1px solid #1890ff;
    `}
`;

const ActionsSection = styled.div`
    display: flex;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid #f0f0f0;
    margin-top: auto;
`;

const ActionButton = styled.button`
    flex: 1;
    padding: 8px 16px;
    border: 1px solid ${props => props.$primary ? '#1890ff' : '#d9d9d9'};
    border-radius: 4px;
    background: ${props => props.$primary ? '#1890ff' : 'white'};
    color: ${props => props.$primary ? 'white' : '#595959'};
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
        ${props => props.$primary ? `
            background: #40a9ff;
            border-color: #40a9ff;
        ` : `
            border-color: #1890ff;
            color: #1890ff;
        `}
    }
`;

// Modal Components para móvil
const MobileModal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: ${props => props.$open ? 'flex' : 'none'};
    align-items: flex-end;
    
    @media (min-height: 600px) {
        align-items: center;
        justify-content: center;
    }
`;

const ModalContent = styled.div`
    background: white;
    border-radius: 8px 8px 0 0;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    
    @media (min-height: 600px) {
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        max-height: 80vh;
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
`;

const ModalTitle = styled.h3`
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #262626;
`;

const CloseButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: #8c8c8c;
    cursor: pointer;
    border-radius: 4px;
    
    &:hover {
        background: #f5f5f5;
        color: #595959;
    }
`;

const ModalBody = styled.div`
    padding: 0;
`;