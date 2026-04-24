import { describe, expect, it } from 'vitest';

import {
  buildBankStatementLinesCsv,
  buildLiquidityLedgerCsv,
  buildTreasuryCockpitCsv,
  buildTreasuryExportFileName,
} from './treasuryExports';

describe('buildTreasuryCockpitCsv', () => {
  it('includes pending and written off counts per account', () => {
    const csv = buildTreasuryCockpitCsv({
      accounts: [
        {
          currency: 'DOP',
          id: 'bank-1',
          key: 'bank:bank-1',
          kind: 'bank',
          label: 'Banco principal',
          openingBalance: 0,
          source: {
            businessId: 'business-1',
            currency: 'DOP',
            id: 'bank-1',
            name: 'Banco principal',
            status: 'active',
          },
          status: 'active',
        },
      ],
      currentBalancesByAccountKey: {
        'bank:bank-1': 150,
      },
      latestReconciliationsByBankAccountId: {
        'bank-1': {
          bankAccountId: 'bank-1',
          businessId: 'business-1',
          id: 'rec-1',
          ledgerBalance: 150,
          statementBalance: 140,
          statementDate: new Date('2026-04-18'),
          status: 'variance',
          variance: -10,
        },
      },
      statementLinesByBankAccountId: {
        'bank-1': [
          {
            bankAccountId: 'bank-1',
            businessId: 'business-1',
            id: 'line-1',
            lineType: 'transaction',
            statementDate: new Date('2026-04-18'),
            status: 'pending',
          },
          {
            bankAccountId: 'bank-1',
            businessId: 'business-1',
            id: 'line-2',
            lineType: 'transaction',
            statementDate: new Date('2026-04-18'),
            status: 'written_off',
          },
        ],
      },
    });

    expect(csv).toContain('pendingStatementLines');
    expect(csv).toContain('writtenOffStatementLines');
    expect(csv).toContain('Banco principal');
  });
});

describe('buildLiquidityLedgerCsv', () => {
  it('exports signed ledger amounts', () => {
    const csv = buildLiquidityLedgerCsv({
      account: {
        currency: 'DOP',
        id: 'bank-1',
        key: 'bank:bank-1',
        kind: 'bank',
        label: 'Banco principal',
        openingBalance: 0,
        source: {
          businessId: 'business-1',
          currency: 'DOP',
          id: 'bank-1',
          name: 'Banco principal',
          status: 'active',
        },
        status: 'active',
      },
      entries: [
        {
          accountId: 'bank-1',
          accountType: 'bank',
          amount: 55,
          businessId: 'business-1',
          currency: 'DOP',
          direction: 'out',
          id: 'mov-1',
          occurredAt: new Date('2026-04-18'),
          sourceType: 'expense',
        },
      ],
    });

    expect(csv).toContain('amountSigned');
    expect(csv).toContain('-55');
  });
});

describe('buildBankStatementLinesCsv', () => {
  it('exports written off statement lines', () => {
    const csv = buildBankStatementLinesCsv({
      account: {
        currency: 'DOP',
        id: 'bank-1',
        key: 'bank:bank-1',
        kind: 'bank',
        label: 'Banco principal',
        openingBalance: 0,
        source: {
          businessId: 'business-1',
          currency: 'DOP',
          id: 'bank-1',
          name: 'Banco principal',
          status: 'active',
        },
        status: 'active',
      },
      statementLines: [
        {
          amount: 10,
          bankAccountId: 'bank-1',
          businessId: 'business-1',
          id: 'line-1',
          lineType: 'transaction',
          statementDate: new Date('2026-04-18'),
          status: 'written_off',
          direction: 'out',
        },
      ],
    });

    expect(csv).toContain('written_off');
    expect(csv).toContain('-10');
  });
});

describe('buildTreasuryExportFileName', () => {
  it('slugifies file names', () => {
    const fileName = buildTreasuryExportFileName({
      prefix: 'Treasury Ledger',
      suffix: 'Banco Principal',
    });

    expect(fileName).toMatch(
      /^treasury-ledger-banco-principal-\d{4}-\d{2}-\d{2}\.csv$/,
    );
  });
});
