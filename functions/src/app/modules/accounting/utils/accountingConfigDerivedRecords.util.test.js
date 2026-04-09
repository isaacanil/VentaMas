import { describe, expect, it } from 'vitest';

import {
  buildAccountingSettingsDerivedPlan,
  buildEntityDerivedPlan,
  buildExchangeRateId,
} from './accountingConfigDerivedRecords.util.js';

describe('accountingConfigDerivedRecords.util', () => {
  it('builds settings history, audit, exchange rates, and current ids from semantic changes', () => {
    const changedAt = new Date('2026-04-05T10:30:00.000Z');
    const plan = buildAccountingSettingsDerivedPlan({
      businessId: 'biz-1',
      beforeData: {
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedBy: 'user-a',
        generalAccountingEnabled: false,
        functionalCurrency: 'DOP',
        documentCurrencies: ['DOP'],
        manualRatesByCurrency: {},
        bankAccountsEnabled: true,
        bankPaymentPolicy: {},
      },
      afterData: {
        updatedAt: changedAt,
        updatedBy: 'user-b',
        generalAccountingEnabled: true,
        functionalCurrency: 'DOP',
        documentCurrencies: ['DOP', 'USD'],
        manualRatesByCurrency: {
          USD: {
            buyRate: 58.25,
            sellRate: 58.8,
          },
        },
        currentExchangeRateIdsByCurrency: {},
        bankAccountsEnabled: true,
        bankPaymentPolicy: {
          defaultBankAccountId: 'bank-1',
        },
      },
    });

    expect(plan).not.toBeNull();
    expect(plan.historyEntry).toMatchObject({
      businessId: 'biz-1',
      changeType: 'updated',
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    expect(plan.auditEntry).toMatchObject({
      scope: 'settings',
      entityId: 'accounting_settings',
      changeType: 'updated',
    });
    expect(plan.shouldUpdateCurrentIds).toBe(true);
    expect(plan.exchangeRateRecords).toHaveLength(1);
    expect(plan.currentExchangeRateIdsByCurrency).toEqual({
      USD: buildExchangeRateId({
        quoteCurrency: 'USD',
        baseCurrency: 'DOP',
        historyId: plan.historyId,
      }),
    });
  });

  it('skips settings history rewrite when only current exchange rate ids changed', () => {
    const changedAt = new Date('2026-04-05T10:30:00.000Z');
    const semanticPlan = buildAccountingSettingsDerivedPlan({
      businessId: 'biz-1',
      beforeData: {
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedBy: 'user-a',
        generalAccountingEnabled: false,
        functionalCurrency: 'DOP',
        documentCurrencies: ['DOP'],
        manualRatesByCurrency: {},
        bankAccountsEnabled: true,
        bankPaymentPolicy: {},
      },
      afterData: {
        updatedAt: changedAt,
        updatedBy: 'user-b',
        generalAccountingEnabled: true,
        functionalCurrency: 'DOP',
        documentCurrencies: ['DOP', 'USD'],
        manualRatesByCurrency: {
          USD: { buyRate: 58.25, sellRate: 58.8 },
        },
        currentExchangeRateIdsByCurrency: {},
      },
    });

    const plan = buildAccountingSettingsDerivedPlan({
      businessId: 'biz-1',
      beforeData: {
        updatedAt: changedAt,
        updatedBy: 'user-b',
        generalAccountingEnabled: true,
        functionalCurrency: 'DOP',
        documentCurrencies: ['DOP', 'USD'],
        manualRatesByCurrency: {
          USD: { buyRate: 58.25, sellRate: 58.8 },
        },
        currentExchangeRateIdsByCurrency:
          semanticPlan?.currentExchangeRateIdsByCurrency ?? {},
      },
      afterData: {
        updatedAt: changedAt,
        updatedBy: 'user-b',
        generalAccountingEnabled: true,
        functionalCurrency: 'DOP',
        documentCurrencies: ['DOP', 'USD'],
        manualRatesByCurrency: {
          USD: { buyRate: 58.25, sellRate: 58.8 },
        },
        currentExchangeRateIdsByCurrency:
          semanticPlan?.currentExchangeRateIdsByCurrency ?? {},
      },
    });

    expect(plan).toBeNull();
  });

  it('marks seeded entities and status changes for derived histories', () => {
    const createdPlan = buildEntityDerivedPlan({
      scope: 'chart_of_account',
      businessId: 'biz-1',
      entityId: 'coa-1',
      beforeData: null,
      afterData: {
        createdAt: new Date('2026-04-05T10:30:00.000Z'),
        code: '1100',
        name: 'Caja',
        type: 'asset',
        metadata: {
          seededBy: 'default_chart_template',
        },
      },
    });

    expect(createdPlan).not.toBeNull();
    expect(createdPlan.changeType).toBe('seeded');
    expect(createdPlan.auditEntry).toMatchObject({
      scope: 'chart_of_account',
      entityLabel: '1100 · Caja',
    });

    const statusPlan = buildEntityDerivedPlan({
      scope: 'posting_profile',
      businessId: 'biz-1',
      entityId: 'profile-1',
      beforeData: {
        updatedAt: new Date('2026-04-05T10:30:00.000Z'),
        name: 'Perfil ventas',
        status: 'active',
      },
      afterData: {
        updatedAt: new Date('2026-04-05T11:00:00.000Z'),
        name: 'Perfil ventas',
        status: 'inactive',
      },
    });

    expect(statusPlan).not.toBeNull();
    expect(statusPlan.changeType).toBe('status_changed');
    expect(statusPlan.historyEntry).toMatchObject({
      postingProfileId: 'profile-1',
      changeType: 'status_changed',
    });
  });
});
