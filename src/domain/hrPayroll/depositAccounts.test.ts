import { describe, expect, it } from 'vitest';

import {
  formatHrDepositAccount,
  maskHrDepositAccountNumber,
  normalizeHrDepositAccount,
} from './depositAccounts';

describe('depositAccounts', () => {
  it('normalizes and masks HR deposit account data', () => {
    const account = normalizeHrDepositAccount({
      bankName: '  Banco Demo  ',
      accountType: 'SAVINGS',
      accountNumber: '1234 5678 9',
      holderName: ' Ana Perez ',
    });

    expect(account).toEqual({
      bankName: 'Banco Demo',
      accountType: 'savings',
      accountNumber: '1234 5678 9',
      holderName: 'Ana Perez',
    });
    expect(maskHrDepositAccountNumber(account?.accountNumber)).toBe('****6789');

    const formatted = formatHrDepositAccount({ depositAccount: account });

    expect(formatted).toContain('Banco Demo');
    expect(formatted).toContain('****6789');
    expect(formatted).not.toContain('1234 5678 9');
  });
});
