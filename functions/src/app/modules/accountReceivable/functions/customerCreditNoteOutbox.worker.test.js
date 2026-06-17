import { describe, expect, it } from 'vitest';

import { resolveCreditNoteStatus } from './customerCreditNoteOutbox.worker.js';

describe('customerCreditNoteOutbox.worker', () => {
  it.each([
    ['issued', 'issued'],
    ['accepted', 'issued'],
    ['accepted_conditional', 'issued'],
    ['shadow_ready', 'issued'],
    ['rejected', 'electronic_failed'],
    ['error', 'electronic_failed'],
    ['submitted', 'electronic_pending'],
  ])('maps GISYS status %s to credit note status %s', (status, expected) => {
    expect(resolveCreditNoteStatus({ status })).toBe(expected);
  });
});
