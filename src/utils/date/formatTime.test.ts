import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  convertMillisToDate,
  getTimeElapsed,
} from './formatTime';

describe('formatTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats elapsed seconds and minutes from the current time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T12:00:00.000Z'));

    expect(getTimeElapsed(Date.parse('2026-06-17T11:59:45.000Z'))).toBe(
      'Hace 15 segundos',
    );
    expect(getTimeElapsed(Date.parse('2026-06-17T11:55:00.000Z'))).toBe(
      'Hace 5 minutos',
    );
  });

  it('formats millis as a short date', () => {
    expect(convertMillisToDate(new Date(2026, 5, 17).getTime())).toBe(
      '17/06/2026',
    );
  });
});
