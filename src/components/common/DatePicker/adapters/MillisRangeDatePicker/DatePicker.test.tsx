import { fireEvent, render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import { describe, expect, it, vi } from 'vitest';

import { DatePicker, type DateRangeValue } from './DatePicker';
import {
  toDateRangeValue,
  toRangePickerValue,
} from './utils/dateRangeAdapter';

type RangePickerMockProps = {
  value: [DateTime, DateTime] | null;
  onChange: (dates: [DateTime, DateTime] | null) => void;
};

vi.mock('@/components/DatePicker', () => ({
  default: {
    RangePicker: ({ value, onChange }: RangePickerMockProps) => (
      <button
        type="button"
        data-testid="range-picker"
        onClick={() => onChange(null)}
      >
        {value ? 'with-range' : 'empty-range'}
      </button>
    ),
  },
}));

describe('DatePicker', () => {
  it('shows the today default without pushing derived state on mount', () => {
    const setDates = vi.fn();

    render(
      <DatePicker dates={null} datesDefault="today" setDates={setDates} />,
    );

    expect(screen.getByTestId('range-picker')).toHaveTextContent('with-range');
    expect(setDates).not.toHaveBeenCalled();
  });

  it('keeps the range empty after the user clears the default value', () => {
    const setDates = vi.fn();
    const emptyDates: DateRangeValue = { startDate: null, endDate: null };

    const { rerender } = render(
      <DatePicker dates={null} datesDefault="today" setDates={setDates} />,
    );

    fireEvent.click(screen.getByTestId('range-picker'));

    expect(setDates).toHaveBeenCalledWith(emptyDates);

    rerender(
      <DatePicker
        dates={emptyDates}
        datesDefault="today"
        setDates={setDates}
      />,
    );

    expect(screen.getByTestId('range-picker')).toHaveTextContent('empty-range');
  });

  it('normalizes selected DateTime values to full-day millis', () => {
    const start = DateTime.fromISO('2026-02-03T15:30:00');
    const end = DateTime.fromISO('2026-02-05T08:15:00');

    expect(toDateRangeValue([start, end])).toEqual({
      startDate: start.startOf('day').toMillis(),
      endDate: end.endOf('day').toMillis(),
    });
  });

  it('adapts millis ranges back to Luxon picker values', () => {
    const start = DateTime.fromISO('2026-02-03T00:00:00').toMillis();
    const end = DateTime.fromISO('2026-02-05T23:59:59').toMillis();

    const pickerValue = toRangePickerValue({ startDate: start, endDate: end });

    expect(pickerValue?.[0].toMillis()).toBe(start);
    expect(pickerValue?.[1].toMillis()).toBe(end);
  });
});
