import { describe, expect, it } from 'vitest';

import {
  buildAccountingAuditComparisonRows,
  buildAccountingAuditEntryRecord,
  buildLegacySettingsAuditEntries,
  normalizeAccountingAuditEntry,
} from './accountingAudit';

describe('accountingAudit', () => {
  it('builds normalized create entries for critical collections', () => {
    const entry = buildAccountingAuditEntryRecord({
      businessId: 'biz-1',
      scope: 'bank_account',
      entityId: 'bank-1',
      historyId: 'hist-1',
      entityLabel: 'Banco Popular · Operativa',
      changeType: 'created',
      changedAt: '2026-04-05T10:00:00.000Z',
      changedBy: 'user-1',
      after: {
        name: 'Operativa',
        institutionName: 'Banco Popular',
        currency: 'DOP',
        status: 'active',
      },
    });

    expect(entry).toMatchObject({
      id: 'bank_account:hist-1',
      scope: 'bank_account',
      entityId: 'bank-1',
      changeType: 'created',
      changedBy: 'user-1',
    });
    expect(entry.after).toMatchObject({
      name: 'Operativa',
      institutionName: 'Banco Popular',
    });
  });

  it('builds comparison rows for updated entries', () => {
    const rows = buildAccountingAuditComparisonRows(
      buildAccountingAuditEntryRecord({
        businessId: 'biz-1',
        scope: 'chart_of_account',
        entityId: 'coa-1',
        historyId: 'hist-2',
        changeType: 'updated',
        changedAt: '2026-04-05T10:00:00.000Z',
        changedBy: 'user-2',
        before: {
          code: '1100',
          name: 'Caja general',
          status: 'active',
        },
        after: {
          code: '1100',
          name: 'Caja principal',
          status: 'active',
        },
      }),
    );

    expect(rows.find((row) => row.key === 'name')).toEqual({
      key: 'name',
      label: 'Nombre',
      before: 'Caja general',
      after: 'Caja principal',
      changed: true,
    });
  });

  it('exposes status changes coherently', () => {
    const rows = buildAccountingAuditComparisonRows(
      buildAccountingAuditEntryRecord({
        businessId: 'biz-1',
        scope: 'posting_profile',
        entityId: 'profile-1',
        historyId: 'hist-3',
        changeType: 'status_changed',
        changedAt: '2026-04-05T10:00:00.000Z',
        changedBy: 'user-3',
        before: {
          name: 'Cobro en caja',
          status: 'active',
          linesTemplate: [{ id: '1' }, { id: '2' }],
        },
        after: {
          name: 'Cobro en caja',
          status: 'inactive',
          linesTemplate: [{ id: '1' }, { id: '2' }],
        },
      }),
    );

    expect(rows.find((row) => row.key === 'status')).toEqual({
      key: 'status',
      label: 'Estado',
      before: 'active',
      after: 'inactive',
      changed: true,
    });
  });

  it('normalizes persisted audit records and derives settings before/after', () => {
    const normalized = normalizeAccountingAuditEntry({
      id: 'settings:hist-4',
      businessId: 'biz-1',
      scope: 'settings',
      entityId: 'accounting_settings',
      entityLabel: 'Configuracion contable',
      changeType: 'updated',
      changedAt: '2026-04-05T10:00:00.000Z',
      changedBy: 'user-4',
      before: {
        functionalCurrency: 'USD',
      },
      after: {
        functionalCurrency: 'DOP',
      },
    });

    const legacyEntries = buildLegacySettingsAuditEntries({
      businessId: 'biz-1',
      entries: [
        {
          id: 'hist-new',
        schemaVersion: 7,
        rolloutMode: 'pilot',
        generalAccountingEnabled: true,
        functionalCurrency: 'DOP',
        documentCurrencies: ['DOP'],
        exchangeRateMode: 'manual',
        manualRatesByCurrency: {},
        currentExchangeRateIdsByCurrency: {},
        bankAccountsEnabled: true,
        bankPaymentPolicy: {
          defaultBankAccountId: null,
          moduleOverrides: {
            sales: { enabled: false, bankAccountId: null },
            accounts_receivable: { enabled: false, bankAccountId: null },
            purchases: { enabled: false, bankAccountId: null },
            accounts_payable: { enabled: false, bankAccountId: null },
            expenses: { enabled: false, bankAccountId: null },
            cash: { enabled: false, bankAccountId: null },
            banking: { enabled: false, bankAccountId: null },
            fx: { enabled: false, bankAccountId: null },
            general_ledger: { enabled: false, bankAccountId: null },
            tax: { enabled: false, bankAccountId: null },
          },
        },
        overridePolicy: 'settings-only',
        updatedBy: 'user-4',
        changedAt: '2026-04-05T10:00:00.000Z',
        changedBy: 'user-4',
        },
        {
          id: 'hist-old',
        schemaVersion: 7,
        rolloutMode: 'pilot',
        generalAccountingEnabled: false,
        functionalCurrency: 'USD',
        documentCurrencies: ['USD'],
        exchangeRateMode: 'manual',
        manualRatesByCurrency: {},
        currentExchangeRateIdsByCurrency: {},
        bankAccountsEnabled: true,
        bankPaymentPolicy: {
          defaultBankAccountId: null,
          moduleOverrides: {
            sales: { enabled: false, bankAccountId: null },
            accounts_receivable: { enabled: false, bankAccountId: null },
            purchases: { enabled: false, bankAccountId: null },
            accounts_payable: { enabled: false, bankAccountId: null },
            expenses: { enabled: false, bankAccountId: null },
            cash: { enabled: false, bankAccountId: null },
            banking: { enabled: false, bankAccountId: null },
            fx: { enabled: false, bankAccountId: null },
            general_ledger: { enabled: false, bankAccountId: null },
            tax: { enabled: false, bankAccountId: null },
          },
        },
        overridePolicy: 'settings-only',
        updatedBy: 'user-4',
        changedAt: '2026-04-04T10:00:00.000Z',
        changedBy: 'user-4',
        },
      ],
    });

    expect(normalized?.scope).toBe('settings');
    expect(legacyEntries[0].before).toMatchObject({
      functionalCurrency: 'USD',
    });
    expect(legacyEntries[0].after).toMatchObject({
      functionalCurrency: 'DOP',
    });
  });
});
