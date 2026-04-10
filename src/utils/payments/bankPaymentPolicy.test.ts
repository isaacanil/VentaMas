import { describe, expect, it } from 'vitest';

import {
  defaultBankPaymentPolicy,
  getBankPaymentModuleOverride,
  normalizeBankPaymentPolicy,
  requiresManualBankAccountSelection,
  resolveConfiguredBankAccountId,
  resolveEffectiveBankAccountId,
  syncBankPaymentPolicyDefaultAccount,
  updateBankPaymentModuleOverride,
} from '@/utils/payments/bankPaymentPolicy';

describe('bank payment policy helpers', () => {
  it('defaults bank-backed methods to manual selection', () => {
    const policy = defaultBankPaymentPolicy();

    expect(policy.defaultBankAccountId).toBeNull();
    expect(policy.moduleOverrides).toEqual({
      sales: { enabled: false, bankAccountId: null },
      expenses: { enabled: false, bankAccountId: null },
      accountsReceivable: { enabled: false, bankAccountId: null },
      purchases: { enabled: false, bankAccountId: null },
    });
    expect(policy.moduleBankAccountIds).toEqual({
      sales: null,
      expenses: null,
      accountsReceivable: null,
      purchases: null,
    });
    expect(policy.card).toEqual({
      selectionMode: 'manual',
      defaultBankAccountId: null,
    });
    expect(policy.transfer).toEqual({
      selectionMode: 'manual',
      defaultBankAccountId: null,
    });
  });

  it('normalizes persisted default-account policies', () => {
    const policy = normalizeBankPaymentPolicy({
      defaultBankAccountId: ' bank-1 ',
      card: {
        selectionMode: 'default',
        defaultBankAccountId: 'bank-9',
      },
    });

    expect(policy.defaultBankAccountId).toBe('bank-1');
    expect(policy.moduleOverrides).toEqual({
      sales: { enabled: false, bankAccountId: null },
      expenses: { enabled: false, bankAccountId: null },
      accountsReceivable: { enabled: false, bankAccountId: null },
      purchases: { enabled: false, bankAccountId: null },
    });
    expect(policy.moduleBankAccountIds).toEqual({
      sales: null,
      expenses: null,
      accountsReceivable: null,
      purchases: null,
    });
    expect(policy.card).toEqual({
      selectionMode: 'default',
      defaultBankAccountId: 'bank-9',
    });
    expect(policy.transfer).toEqual({
      selectionMode: 'manual',
      defaultBankAccountId: null,
    });
  });

  it('does not infer a global fallback from method-specific accounts', () => {
    const policy = normalizeBankPaymentPolicy({
      card: {
        selectionMode: 'default',
        defaultBankAccountId: 'bank-9',
      },
    });

    expect(policy.defaultBankAccountId).toBeNull();
    expect(policy.card.defaultBankAccountId).toBe('bank-9');
  });

  it('falls back to the only active account when the configured default is unavailable', () => {
    const policy = normalizeBankPaymentPolicy({
      transfer: {
        selectionMode: 'default',
        defaultBankAccountId: 'bank-2',
      },
    });

    expect(
      resolveConfiguredBankAccountId({
        policy,
        availableBankAccountIds: new Set(['bank-2']),
      }),
    ).toBe('bank-2');
    expect(
      resolveConfiguredBankAccountId({
        policy,
        availableBankAccountIds: new Set(['bank-9']),
      }),
    ).toBe('bank-9');
  });

  it('auto-resolves the only active account when none is configured explicitly', () => {
    expect(
      resolveConfiguredBankAccountId({
        policy: defaultBankPaymentPolicy(),
        moduleKey: 'sales',
        availableBankAccountIds: ['bank-5'],
      }),
    ).toBe('bank-5');
  });

  it('prefers a provided default account when syncing policy defaults', () => {
    const nextPolicy = syncBankPaymentPolicyDefaultAccount({
      policy: defaultBankPaymentPolicy(),
      availableBankAccountIds: ['bank-3'],
      preferredDefaultBankAccountId: 'bank-3',
    });

    expect(nextPolicy.defaultBankAccountId).toBe('bank-3');
  });

  it('does not auto-assign the only active account as global fallback', () => {
    const nextPolicy = syncBankPaymentPolicyDefaultAccount({
      policy: defaultBankPaymentPolicy(),
      availableBankAccountIds: ['bank-3'],
    });

    expect(nextPolicy.defaultBankAccountId).toBeNull();
  });

  it('preserves the current default account when it remains active', () => {
    const nextPolicy = syncBankPaymentPolicyDefaultAccount({
      policy: normalizeBankPaymentPolicy({
        defaultBankAccountId: 'bank-2',
      }),
      availableBankAccountIds: ['bank-2', 'bank-4'],
    });

    expect(nextPolicy.defaultBankAccountId).toBe('bank-2');
  });

  it('clears the default when the current one is inactive and several remain active', () => {
    const nextPolicy = syncBankPaymentPolicyDefaultAccount({
      policy: normalizeBankPaymentPolicy({
        defaultBankAccountId: 'bank-2',
      }),
      availableBankAccountIds: ['bank-4', 'bank-7'],
    });

    expect(nextPolicy.defaultBankAccountId).toBeNull();
  });

  it('ignores module-specific overrides for runtime resolution and uses the global default', () => {
    const policy = normalizeBankPaymentPolicy({
      defaultBankAccountId: 'bank-1',
      moduleBankAccountIds: {
        purchases: 'bank-4',
      },
    });

    expect(
      resolveConfiguredBankAccountId({
        policy,
        moduleKey: 'sales',
        availableBankAccountIds: ['bank-1', 'bank-4'],
      }),
    ).toBe('bank-1');
    expect(
      resolveConfiguredBankAccountId({
        policy,
        moduleKey: 'purchases',
        availableBankAccountIds: ['bank-1', 'bank-4'],
      }),
    ).toBe('bank-1');
  });

  it('prefers a method-specific default over the global default when the method is provided', () => {
    const policy = normalizeBankPaymentPolicy({
      defaultBankAccountId: 'bank-1',
      card: {
        selectionMode: 'default',
        defaultBankAccountId: 'bank-8',
      },
    });

    expect(
      resolveConfiguredBankAccountId({
        policy,
        method: 'card',
        availableBankAccountIds: ['bank-1', 'bank-8'],
      }),
    ).toBe('bank-8');
    expect(
      resolveConfiguredBankAccountId({
        policy,
        method: 'transfer',
        availableBankAccountIds: ['bank-1', 'bank-8'],
      }),
    ).toBe('bank-1');
  });

  it('treats legacy module ids as enabled overrides', () => {
    const policy = normalizeBankPaymentPolicy({
      moduleBankAccountIds: {
        expenses: 'bank-7',
      },
    });

    expect(getBankPaymentModuleOverride(policy, 'expenses')).toEqual({
      enabled: true,
      bankAccountId: 'bank-7',
    });
    expect(policy.moduleBankAccountIds.expenses).toBe('bank-7');
  });

  it('ignores disabled module overrides and falls back to the global default', () => {
    const policy = normalizeBankPaymentPolicy({
      defaultBankAccountId: 'bank-1',
      moduleOverrides: {
        expenses: {
          enabled: false,
          bankAccountId: 'bank-9',
        },
      },
    });

    expect(
      resolveConfiguredBankAccountId({
        policy,
        moduleKey: 'expenses',
        availableBankAccountIds: ['bank-1', 'bank-9'],
      }),
    ).toBe('bank-1');
    expect(policy.moduleBankAccountIds.expenses).toBeNull();
  });

  it('preserves the selected account when toggling an override off', () => {
    const initialPolicy = normalizeBankPaymentPolicy({
      moduleBankAccountIds: {
        purchases: 'bank-4',
      },
    });

    const disabledPolicy = updateBankPaymentModuleOverride({
      policy: initialPolicy,
      moduleKey: 'purchases',
      patch: { enabled: false },
    });

    expect(getBankPaymentModuleOverride(disabledPolicy, 'purchases')).toEqual({
      enabled: false,
      bankAccountId: 'bank-4',
    });
    expect(disabledPolicy.moduleBankAccountIds.purchases).toBeNull();
  });

  it('requires manual selection only when ambiguity remains unresolved', () => {
    expect(
      requiresManualBankAccountSelection({
        method: 'card',
        policy: defaultBankPaymentPolicy(),
      }),
    ).toBe(true);
    expect(
      requiresManualBankAccountSelection({
        method: 'card',
        policy: defaultBankPaymentPolicy(),
        availableBankAccountIds: ['bank-1'],
      }),
    ).toBe(false);
    expect(
      requiresManualBankAccountSelection({
        method: 'card',
        policy: normalizeBankPaymentPolicy({
          defaultBankAccountId: 'bank-1',
        }),
        availableBankAccountIds: ['bank-1', 'bank-2'],
      }),
    ).toBe(false);
  });

  it('uses the effective configured account over the transient payment selection', () => {
    expect(
      resolveEffectiveBankAccountId({
        method: 'card',
        bankAccountId: 'bank-3',
        policy: normalizeBankPaymentPolicy({
          defaultBankAccountId: 'bank-7',
        }),
        availableBankAccountIds: new Set(['bank-3', 'bank-7']),
      }),
    ).toBe('bank-7');
  });

  it('uses the method-specific configured account over the global default', () => {
    expect(
      resolveEffectiveBankAccountId({
        method: 'card',
        bankAccountId: 'bank-3',
        policy: normalizeBankPaymentPolicy({
          defaultBankAccountId: 'bank-7',
          card: {
            selectionMode: 'default',
            defaultBankAccountId: 'bank-9',
          },
        }),
        availableBankAccountIds: new Set(['bank-3', 'bank-7', 'bank-9']),
      }),
    ).toBe('bank-9');
  });
});
