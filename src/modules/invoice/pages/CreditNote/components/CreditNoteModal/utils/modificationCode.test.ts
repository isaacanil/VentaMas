import { describe, expect, it } from 'vitest';

import { isCreditNoteTextCorrectionWithAmount } from './modificationCode';

describe('credit note modification code rules', () => {
  it('blocks DGII text correction when the credit note has amount', () => {
    expect(
      isCreditNoteTextCorrectionWithAmount({
        modificationCode: '2',
        totalAmount: 100,
      }),
    ).toBe(true);
  });

  it('allows amount corrections with DGII code 3', () => {
    expect(
      isCreditNoteTextCorrectionWithAmount({
        modificationCode: '3',
        totalAmount: 100,
      }),
    ).toBe(false);
  });
});
