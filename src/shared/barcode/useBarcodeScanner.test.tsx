import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useBarcodeScanner } from './useBarcodeScanner';

let nowMs = 0;

const advanceClock = (ms: number) => {
  act(() => {
    nowMs += ms;
    vi.advanceTimersByTime(ms);
  });
};

const pressKey = (
  key: string,
  options: KeyboardEventInit = {},
  target: HTMLElement | Document = document,
) => {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        key,
        ...options,
      }),
    );
  });
};

const pressKeys = (
  keys: ReadonlyArray<string>,
  target: HTMLElement | Document = document,
) => {
  for (const key of keys) {
    pressKey(key, {}, target);
  }
};

describe('useBarcodeScanner', () => {
  beforeEach(() => {
    nowMs = 0;
    vi.useFakeTimers();
    vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it.each(['Enter', 'Tab'])(
    'emits scanner input on %s with scan metadata',
    (terminationKey) => {
      const onBarcode = vi.fn();
      renderHook(() => useBarcodeScanner(onBarcode));

      pressKeys(['A', 'B', '1', '2']);
      pressKey(terminationKey);

      expect(onBarcode).toHaveBeenCalledTimes(1);
      expect(onBarcode).toHaveBeenCalledWith('AB12', {
        fromEditable: false,
        charCount: 4,
        terminatedBy: terminationKey,
      });
    },
  );

  it('emits scanner input on timeout with scan metadata', () => {
    const onBarcode = vi.fn();
    renderHook(() =>
      useBarcodeScanner(onBarcode, {
        flushTimeoutMs: 75,
      }),
    );

    pressKeys(['7', '5', '0', '0', '1']);
    advanceClock(75);

    expect(onBarcode).toHaveBeenCalledTimes(1);
    expect(onBarcode).toHaveBeenCalledWith('75001', {
      fromEditable: false,
      charCount: 5,
      terminatedBy: 'timeout',
    });
  });

  it('ignores keyboard input while disabled', () => {
    const onBarcode = vi.fn();
    renderHook(() =>
      useBarcodeScanner(onBarcode, {
        enabled: false,
        flushTimeoutMs: 20,
      }),
    );

    pressKeys(['A', 'B', 'C', 'D', 'Enter']);
    advanceClock(20);

    expect(onBarcode).not.toHaveBeenCalled();
  });

  it('ignores ctrl, meta, alt, and nonprintable keys', () => {
    const onBarcode = vi.fn();
    renderHook(() =>
      useBarcodeScanner(onBarcode, {
        flushTimeoutMs: 20,
      }),
    );

    pressKey('A', { ctrlKey: true });
    pressKey('B', { metaKey: true });
    pressKey('C', { altKey: true });
    pressKey('Shift');
    pressKey('ArrowDown');
    pressKey('Enter');
    advanceClock(20);

    expect(onBarcode).not.toHaveBeenCalled();
  });

  it('does not emit slow typing from editable fields', () => {
    const onBarcode = vi.fn();
    const input = document.createElement('input');
    document.body.append(input);

    renderHook(() =>
      useBarcodeScanner(onBarcode, {
        flushTimeoutMs: 1_000,
        maxInterKeyDelayMs: 50,
        minLength: 4,
      }),
    );

    for (const key of ['A', 'B', 'C', 'D']) {
      pressKey(key, {}, input);
      advanceClock(120);
    }
    pressKey('Enter', {}, input);
    advanceClock(1_000);

    expect(onBarcode).not.toHaveBeenCalled();
  });

  it('removes the keydown listener and clears pending timeout on unmount', () => {
    const onBarcode = vi.fn();
    const addListener = vi.spyOn(document, 'addEventListener');
    const removeListener = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useBarcodeScanner(onBarcode, {
        flushTimeoutMs: 20,
      }),
    );

    const keydownHandler = addListener.mock.calls.find(
      ([eventName]) => eventName === 'keydown',
    )?.[1];

    pressKeys(['9', '8', '7', '6']);
    unmount();
    advanceClock(20);
    pressKeys(['1', '2', '3', '4', 'Enter']);

    expect(keydownHandler).toEqual(expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('keydown', keydownHandler);
    expect(onBarcode).not.toHaveBeenCalled();
  });
});
