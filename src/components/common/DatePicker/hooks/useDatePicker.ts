import { DateTime } from 'luxon';
import { useState, useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type {
  DatePickerPreset,
  DatePickerValue,
  UseDatePickerArgs,
} from '../types';

export const useDatePicker = ({
  mode,
  value,
  onChange,
  presets,
}: UseDatePickerArgs) => {
  const [open, setOpen] = useState(false);
  // Inicializar currentDate basado en el valor
  const [currentDate, setCurrentDate] = useState<DateTime>(() => {
    if (value) {
      if (mode === 'range' && Array.isArray(value) && value[0]) {
        return value[0];
      } else if (mode === 'single' && value) {
        return value;
      }
    }
    return DateTime.local();
  });
  const [hoverDate, setHoverDate] = useState<DateTime | null>(null);
  const [rangeStart, setRangeStart] = useState<DateTime | null>(null);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const presetsDropdownRef = useRef<HTMLDivElement | null>(null);
  const initialValueRef = useRef<DatePickerValue>(value);

  const [prevValue, setPrevValue] = useState<DatePickerValue>(value);

  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const nextDate =
        mode === 'range' && Array.isArray(value) && value[0]
          ? value[0]
          : mode === 'single'
            ? value
            : null;

      if (nextDate) {
        setCurrentDate(nextDate);
      }
    }
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        presetsDropdownRef.current &&
        !presetsDropdownRef.current.contains(event.target)
      ) {
        setShowPresetsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePresetClick = (preset: DatePickerPreset, _isMobile = false) => {
    onChange(preset.value);
    setRangeStart(null);
    setOpen(false);
  };

  const handleClear = (
    e: ReactMouseEvent<HTMLElement> | null,
    finalPresets: DatePickerPreset[] = [],
  ) => {
    if (e) {
      e.stopPropagation();
    }
    const fallbackSource =
      finalPresets.length > 0 ? finalPresets : presets || [];
    const fallback = fallbackSource.length > 0 ? fallbackSource[0].value : null;
    const newValue = initialValueRef.current ?? fallback;
    onChange(newValue);
    setRangeStart(null);
  };

  const handleDateClick = (date: DateTime) => {
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
        const isBefore = rangeStart.toMillis() < date.toMillis();
        const start = isBefore ? rangeStart : date;
        const end = isBefore ? date : rangeStart;
        onChange([start, end]);
        setRangeStart(null);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) =>
      direction === 'prev'
        ? prev.minus({ months: 1 })
        : prev.plus({ months: 1 }),
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
    getCurrentRangeEnd,
  };
};
