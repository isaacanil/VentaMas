import { describe, expect, it } from 'vitest';

import type { ChartOfAccount } from '@/types/accounting';
import {
  buildBankLedgerAccountName,
  buildBankLedgerChartAccountDraft,
  buildNextBankLedgerAccountCode,
  findBankChartParentAccount,
} from './bankAccountChartAccounts';

const buildAccount = (
  account: Partial<ChartOfAccount> & Pick<ChartOfAccount, 'id' | 'code'>,
): ChartOfAccount => ({
  id: account.id,
  businessId: 'business-1',
  code: account.code,
  name: account.name ?? 'Cuenta',
  type: account.type ?? 'asset',
  parentId: account.parentId ?? null,
  postingAllowed: account.postingAllowed ?? true,
  status: account.status ?? 'active',
  normalSide: account.normalSide ?? 'debit',
  currencyMode: account.currencyMode ?? 'functional_only',
  systemKey: account.systemKey ?? null,
  metadata: account.metadata ?? {},
});

describe('bankAccountChartAccounts', () => {
  it('resuelve la cuenta padre bancaria canonica', () => {
    const parent = buildAccount({
      id: 'bank-root',
      code: '1110',
      name: 'Cuentas bancarias',
      systemKey: 'bank',
    });

    expect(findBankChartParentAccount([parent])?.id).toBe('bank-root');
  });

  it('calcula el siguiente codigo hijo bajo 1110', () => {
    expect(
      buildNextBankLedgerAccountCode({
        accounts: [
          buildAccount({ id: 'bank-root', code: '1110' }),
          buildAccount({ id: 'bank-01', code: '1110.01' }),
          buildAccount({ id: 'bank-03', code: '1110.03' }),
        ],
        parentCode: '1110',
      }),
    ).toBe('1110.04');
  });

  it('arma el nombre contable con banco, tipo y ultimos digitos', () => {
    expect(
      buildBankLedgerAccountName({
        name: 'Cuenta operativa',
        currency: 'DOP',
        institutionName: 'Banco Popular Dominicano',
        type: 'checking',
        accountNumberLast4: '1234',
      }),
    ).toBe('Banco Popular Dominicano Corriente 1234');
  });

  it('crea el borrador de subcuenta con metadata enlazada al banco', () => {
    const parent = buildAccount({
      id: 'bank-root',
      code: '1110',
      name: 'Cuentas bancarias',
      systemKey: 'bank',
    });

    const draft = buildBankLedgerChartAccountDraft({
      accounts: [parent],
      bankAccountId: 'bank-1',
      parentAccount: parent,
      bankAccount: {
        name: 'Cuenta operativa',
        currency: 'DOP',
        institutionName: 'Banco Popular Dominicano',
        type: 'checking',
        accountNumberLast4: '1234',
      },
    });

    expect(draft).toMatchObject({
      code: '1110.01',
      name: 'Banco Popular Dominicano Corriente 1234',
      parentId: 'bank-root',
      postingAllowed: true,
      currencyMode: 'multi_currency_reference',
      metadata: {
        source: 'bank_account',
        bankAccountId: 'bank-1',
        bankAccountCurrency: 'DOP',
      },
    });
  });
});
