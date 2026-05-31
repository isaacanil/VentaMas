import { DateTime } from 'luxon';

export type NumberRangeValueObject = {
  min?: number | null;
  max?: number | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  from?: number | null;
  to?: number | null;
  start?: number | null;
  end?: number | null;
  startValue?: number | null;
  endValue?: number | null;
};

export type NumberRangeValue =
  | [number | null, number | null]
  | NumberRangeValueObject
  | null;

export type DateRangeInputValue =
  | [unknown, unknown]
  | { startDate?: unknown; endDate?: unknown }
  | null;

export type DateRangeValue = [DateTime | null, DateTime | null] | null;

export type DateRangeMillisValue = {
  startDate: number | null;
  endDate: number | null;
};

type ActiveFilterLike = {
  value?: unknown;
  isActive?: boolean | ((value: unknown) => boolean);
};

type DateRangeChangeConfig = {
  range: DateRangeValue;
  valueFormat?: 'luxon' | 'timestamp';
  valueAsArray?: boolean;
  onChange?: (
    value: DateRangeValue | DateRangeMillisValue | [number | null, number | null],
  ) => void;
};

export const resolveNumberValue = (...values: Array<unknown>): number | null => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
};

export const getNumberRange = (value?: NumberRangeValue) => {
  if (Array.isArray(value)) return { min: value[0], max: value[1] };
  if (value && typeof value === 'object') {
    return {
      min: resolveNumberValue(
        value.min,
        value.minAmount,
        value.from,
        value.start,
        value.startValue,
      ),
      max: resolveNumberValue(
        value.max,
        value.maxAmount,
        value.to,
        value.end,
        value.endValue,
      ),
    };
  }
  return { min: null, max: null };
};

export const isItemActive = (item: ActiveFilterLike) => {
  if (typeof item.isActive === 'function') {
    return item.isActive(item.value);
  }
  if (item.isActive != null) return Boolean(item.isActive);
  if (Array.isArray(item.value)) return item.value.some(Boolean);
  if (item.value && typeof item.value === 'object') {
    return Object.values(item.value).some(Boolean);
  }
  return Boolean(item.value);
};

const isDateRangeObject = (
  value: unknown,
): value is { startDate?: unknown; endDate?: unknown } =>
  Boolean(value) &&
  typeof value === 'object' &&
  ('startDate' in value || 'endDate' in value);

const toDateTime = (value: unknown): DateTime | null => {
  if (!value) return null;
  if (DateTime.isDateTime(value)) return value;
  if (value instanceof Date) return DateTime.fromJSDate(value);
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return DateTime.fromJSDate((value as { toDate: () => Date }).toDate());
  }
  if (typeof value === 'number') return DateTime.fromMillis(value);
  if (typeof value === 'string') {
    const parsed = DateTime.fromISO(value);
    return parsed.isValid ? parsed : null;
  }
  return null;
};

export const getDateRangeValue = (
  value?: DateRangeInputValue,
): DateRangeValue => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [start, end] = value;
    return [toDateTime(start), toDateTime(end)];
  }
  if (isDateRangeObject(value)) {
    return [
      value.startDate ? toDateTime(value.startDate) : null,
      value.endDate ? toDateTime(value.endDate) : null,
    ];
  }
  return null;
};

export const handleDateRangeChange = ({
  range,
  valueFormat,
  valueAsArray,
  onChange,
}: DateRangeChangeConfig) => {
  if (!onChange) return;
  if (valueFormat === 'luxon') {
    onChange(range);
    return;
  }
  const start = range?.[0] ? range[0].startOf('day').toMillis() : null;
  const end = range?.[1] ? range[1].endOf('day').toMillis() : null;
  if (valueAsArray) {
    onChange([start, end]);
  } else {
    onChange({ startDate: start, endDate: end });
  }
};
