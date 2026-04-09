import { DateTime } from 'luxon';
import type {
  DatePickerMode,
  DatePickerPreset,
  DatePickerValue,
} from '../types';

const DATE_LOCALE = 'es';

const toLuxonFormat = (format = 'DD/MM/YYYY') =>
  format
    .replace(/YYYY/g, 'yyyy')
    .replace(/YY/g, 'yy')
    .replace(/DD/g, 'dd')
    .replace(/D/g, 'd')
    .replace(/MM/g, 'LL')
    .replace(/M/g, 'L');

const startOfWeekSunday = (date: DateTime) =>
  date.minus({ days: date.weekday % 7 }).startOf('day');

export const formatDisplayValue = (
  value: DatePickerValue,
  format = 'DD/MM/YYYY',
  mode: DatePickerMode = 'single',
) => {
  if (!value) return '';
  const luxonFormat = toLuxonFormat(format);

  const formatValue = (date: DateTime) =>
    date.setLocale(DATE_LOCALE).toFormat(luxonFormat);

  if (mode === 'range' && Array.isArray(value)) {
    if (
      value[0] &&
      DateTime.isDateTime(value[0]) &&
      value[1] &&
      DateTime.isDateTime(value[1])
    ) {
      return `${formatValue(value[0])} - ${formatValue(value[1])}`;
    } else if (value[0] && DateTime.isDateTime(value[0])) {
      return `${formatValue(value[0])} - ...`;
    }
    return '';
  }

  return value && DateTime.isDateTime(value) && value.toFormat
    ? formatValue(value)
    : '';
};

export const renderCalendarGrid = (currentDate: DateTime) => {
  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const startOfWeek = startOfWeekSunday(startOfMonth);
  const endOfWeek = startOfWeekSunday(endOfMonth)
    .plus({ days: 6 })
    .endOf('day');

  const days = [];
  let day = startOfWeek;

  while (day.toMillis() <= endOfWeek.toMillis()) {
    days.push(day);
    day = day.plus({ days: 1 });
  }

  return days;
};

export const isPresetActive = (
  value: DatePickerValue | undefined,
  preset: DatePickerPreset,
  mode: DatePickerMode = 'single',
) => {
  if (!value) return false;

  if (
    mode === 'single' &&
    DateTime.isDateTime(value) &&
    DateTime.isDateTime(preset.value)
  ) {
    return value.hasSame(preset.value, 'day');
  } else if (
    mode === 'range' &&
    Array.isArray(value) &&
    Array.isArray(preset.value) &&
    value[0] &&
    value[1]
  ) {
    const [vStart, vEnd] = value;
    const [pStart, pEnd] = preset.value;
    if (pStart && pEnd) {
      return vStart.hasSame(pStart, 'day') && vEnd.hasSame(pEnd, 'day');
    }
  }

  return false;
};
