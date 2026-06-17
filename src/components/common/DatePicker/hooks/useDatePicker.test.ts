import { act, renderHook } from '@testing-library/react';
import { DateTime } from 'luxon';
import { describe, expect, it, vi } from 'vitest';

import { useDatePicker } from './useDatePicker';

const date = (isoDate: string) => DateTime.fromISO(isoDate);

describe('useDatePicker', () => {
  it('anchors the visible month to the latest controlled value when opened', () => {
    const onChange = vi.fn();
    const initialValue = date('2026-01-15');
    const controlledValue = date('2026-04-10');

    const { result, rerender } = renderHook(
      ({ value }) =>
        useDatePicker({
          mode: 'single',
          value,
          onChange,
          presets: [],
        }),
      { initialProps: { value: initialValue } },
    );

    rerender({ value: controlledValue });

    expect(result.current.currentDate.month).toBe(1);

    act(() => {
      result.current.setOpen(true);
    });

    expect(result.current.currentDate.month).toBe(4);
  });

  it('preserves the navigated month while the picker remains open', () => {
    const onChange = vi.fn();
    const initialValue = date('2026-01-15');
    const controlledValue = date('2026-03-10');

    const { result, rerender } = renderHook(
      ({ value }) =>
        useDatePicker({
          mode: 'single',
          value,
          onChange,
          presets: [],
        }),
      { initialProps: { value: initialValue } },
    );

    act(() => {
      result.current.setOpen(true);
    });

    act(() => {
      result.current.navigateMonth('next');
    });

    expect(result.current.currentDate.month).toBe(2);

    rerender({ value: controlledValue });

    act(() => {
      result.current.setOpen(true);
    });

    expect(result.current.currentDate.month).toBe(2);

    act(() => {
      result.current.setOpen(false);
    });

    act(() => {
      result.current.setOpen(true);
    });

    expect(result.current.currentDate.month).toBe(3);
  });
});
