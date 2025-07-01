import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';

export const useDatePicker = ({ mode, value, onChange, presets }) => {
    const [open, setOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [hoverDate, setHoverDate] = useState(null);
    const [rangeStart, setRangeStart] = useState(null);
    const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
    const presetsDropdownRef = useRef(null);
    const initialValueRef = useRef(value);

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

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (presetsDropdownRef.current && !presetsDropdownRef.current.contains(event.target)) {
                setShowPresetsDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handlePresetClick = (preset, isMobile) => {
        onChange(preset.value);
        setRangeStart(null);
        setOpen(false);
    };

    const handleClear = (e, finalPresets) => {
        if (e) {
            e.stopPropagation();
        }
        const fallback = finalPresets.length > 0 ? finalPresets[0].value : null;
        const newValue = initialValueRef.current ?? fallback;
        onChange(newValue);
        setRangeStart(null);
    };

    const handleDateClick = (date) => {
        if (mode === 'single') {
            onChange(date);
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

    const navigateMonth = (direction) => {
        setCurrentDate(prev => 
            direction === 'prev' 
                ? prev.subtract(1, 'month')
                : prev.add(1, 'month')
        );
    };

    // Helpers para range actual
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

    return {
        open,
        setOpen,
        currentDate,
        setCurrentDate,
        hoverDate,
        setHoverDate,
        rangeStart,
        setRangeStart,
        showPresetsDropdown,
        setShowPresetsDropdown,
        presetsDropdownRef,
        handlePresetClick,
        handleClear,
        handleDateClick,
        navigateMonth,
        getCurrentRangeStart,
        getCurrentRangeEnd
    };
}; 