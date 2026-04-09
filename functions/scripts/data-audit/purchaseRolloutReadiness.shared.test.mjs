import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMigrationRiskScore,
  inspectPurchaseRolloutReadiness,
} from './purchaseRolloutReadiness.shared.mjs';

test('inspectPurchaseRolloutReadiness marks a configured pilot-like business as ready', () => {
  const inspection = inspectPurchaseRolloutReadiness({
    businessId: 'pilot',
    purchases: [
      {
        id: 'purchase-1',
        status: 'pending',
        paymentTerms: {
          condition: 'thirty_days',
          expectedPaymentAt: 1_710_500_000_000,
          nextPaymentAt: 1_710_500_000_000,
          scheduleType: 'deferred',
          isImmediate: false,
        },
        paymentState: {
          status: 'partial',
          total: 100,
          paid: 40,
          balance: 60,
          paymentCount: 1,
          lastPaymentAt: 1_710_400_000_000,
          nextPaymentAt: 1_710_500_000_000,
        },
        monetary: {
          documentCurrency: { code: 'DOP' },
          functionalCurrency: { code: 'DOP' },
          exchangeRateSnapshot: { rate: 1, rateType: 'buy' },
        },
        totalAmount: 100,
      },
    ],
    accountsPayablePayments: [
      {
        id: 'payment-1',
        status: 'posted',
        purchaseId: 'purchase-1',
        paymentMethods: [
          {
            method: 'card',
            value: 40,
            bankAccountId: 'bank-1',
          },
        ],
      },
    ],
    accountingSettings: {
      functionalCurrency: 'DOP',
      documentCurrencies: ['DOP'],
      bankAccountsEnabled: true,
      bankPaymentPolicy: {
        defaultBankAccountId: 'bank-1',
      },
    },
    bankAccounts: [
      {
        id: 'bank-1',
        status: 'active',
        name: 'Cuenta principal',
      },
    ],
    cashMovements: [
      {
        id: 'movement-1',
        sourceType: 'supplier_payment',
        sourceId: 'payment-1',
        method: 'card',
        bankAccountId: 'bank-1',
        impactsBankLedger: true,
      },
    ],
    sampleLimit: 5,
  });

  assert.equal(inspection.analysis.readiness.isReady, true);
  assert.equal(inspection.analysis.bankAccounts.activeCount, 1);
  assert.equal(
    inspection.analysis.cashMovements.supplierPayment.total,
    1,
  );
  assert.deepEqual(inspection.analysis.readiness.blockers, []);
});

test('inspectPurchaseRolloutReadiness surfaces legacy blockers for an unmigrated business', () => {
  const inspection = inspectPurchaseRolloutReadiness({
    businessId: 'legacy',
    purchases: [
      {
        id: 'purchase-legacy',
        status: 'pending',
        condition: 'cash',
        paymentAt: 2_000,
        replenishments: [{ quantity: 1, unitCost: 50 }],
      },
    ],
    accountsPayablePayments: [],
    accountingSettings: null,
    bankAccounts: [],
    cashMovements: [],
    sampleLimit: 5,
  });

  assert.equal(inspection.analysis.readiness.isReady, false);
  assert.equal(
    inspection.analysis.purchases.missingPaymentStateOperational.count,
    1,
  );
  assert.equal(inspection.analysis.purchases.missingPaymentTerms.count, 1);
  assert.equal(inspection.analysis.purchases.invalidPaymentAt.count, 1);
  assert.match(
    inspection.analysis.readiness.blockers.join(' | '),
    /settings\/accounting/,
  );
});

test('inspectPurchaseRolloutReadiness derives fixes for wrapped legacy purchases', () => {
  const paymentDate = 4_102_444_800_000;
  const inspection = inspectPurchaseRolloutReadiness({
    businessId: 'legacy-wrapped',
    purchases: [
      {
        id: 'purchase-wrapped',
        data: {
          id: 'purchase-wrapped',
          total: 100,
          condition: 'condition_0003',
          state: 'state_3',
          dates: {
            paymentDate,
          },
          replenishments: [{ quantity: 1, unitCost: 100 }],
          provider: 'provider-1',
        },
      },
    ],
    accountsPayablePayments: [],
    accountingSettings: null,
    bankAccounts: [],
    cashMovements: [],
    sampleLimit: 5,
  });

  assert.equal(inspection.analysis.purchases.missingPaymentTerms.count, 1);
  assert.equal(
    inspection.findings.legacyEnvelopePromotionCandidates.length,
    1,
  );
  assert.match(
    JSON.stringify(inspection.findings.legacyEnvelopePromotionCandidates[0].updates),
    /"condition":"fifteen_days"/,
  );
  assert.match(
    JSON.stringify(inspection.findings.legacyEnvelopePromotionCandidates[0].updates),
    /"status":"completed"/,
  );
  assert.match(
    JSON.stringify(inspection.findings.legacyEnvelopePromotionCandidates[0].updates),
    /"paymentAt":4102444800000/,
  );
  assert.deepEqual(
    inspection.findings.derivedPaymentTermsBackfillCandidates[0].paymentTerms,
    {
      condition: 'fifteen_days',
      expectedPaymentAt: paymentDate,
      nextPaymentAt: paymentDate,
      isImmediate: false,
      scheduleType: 'deferred',
    },
  );
  assert.match(
    inspection.findings.derivedPaymentStateBackfillCandidates[0].paymentState.status,
    /unpaid|partial|overdue/,
  );
  assert.equal(
    inspection.findings.derivedPaymentStateBackfillCandidates[0].paymentState.total,
    100,
  );
});

test('inspectPurchaseRolloutReadiness allows cash-only businesses without bank accounts', () => {
  const inspection = inspectPurchaseRolloutReadiness({
    businessId: 'cash-only',
    purchases: [
      {
        id: 'purchase-1',
        status: 'pending',
        paymentTerms: {
          condition: 'cash',
          expectedPaymentAt: 1_710_500_000_000,
          scheduleType: 'immediate',
          isImmediate: true,
          nextPaymentAt: null,
        },
        paymentState: {
          status: 'partial',
          total: 100,
          paid: 40,
          balance: 60,
          paymentCount: 1,
          lastPaymentAt: 1_710_400_000_000,
          nextPaymentAt: null,
        },
        monetary: {
          documentCurrency: { code: 'DOP' },
          functionalCurrency: { code: 'DOP' },
          exchangeRateSnapshot: { rate: 1, rateType: 'buy' },
        },
        totalAmount: 100,
      },
    ],
    accountsPayablePayments: [
      {
        id: 'payment-1',
        status: 'posted',
        purchaseId: 'purchase-1',
        paymentMethods: [
          {
            method: 'cash',
            value: 40,
            cashCountId: 'cash-1',
          },
        ],
      },
    ],
    accountingSettings: {
      functionalCurrency: 'DOP',
      documentCurrencies: ['DOP'],
      bankAccountsEnabled: false,
    },
    bankAccounts: [],
    cashMovements: [
      {
        id: 'movement-1',
        sourceType: 'supplier_payment',
        sourceId: 'payment-1',
        method: 'cash',
        cashCountId: 'cash-1',
        impactsCashDrawer: true,
      },
    ],
    sampleLimit: 5,
  });

  assert.equal(inspection.analysis.readiness.isReady, true);
  assert.equal(inspection.analysis.accountingSettings.bankingMode, 'cash-only');
  assert.equal(
    inspection.analysis.accountingSettings.bankAccountsRequired,
    false,
  );
  assert.ok(
    inspection.analysis.readiness.warnings.some((warning) =>
      warning.includes('cash-only'),
    ),
  );
});

test('buildMigrationRiskScore penalizes heavier businesses', () => {
  const light = inspectPurchaseRolloutReadiness({
    businessId: 'light',
    purchases: [],
    accountsPayablePayments: [],
    accountingSettings: {
      functionalCurrency: 'DOP',
      documentCurrencies: ['DOP'],
      bankAccountsEnabled: true,
    },
    bankAccounts: [{ id: 'bank-1', status: 'active' }],
    cashMovements: [],
  });
  const heavy = inspectPurchaseRolloutReadiness({
    businessId: 'heavy',
    purchases: [
      { id: 'p1', status: 'pending', condition: 'cash', paymentAt: 2_000 },
      { id: 'p2', status: 'pending', condition: 'cash', paymentAt: 2_000 },
    ],
    accountsPayablePayments: [],
    accountingSettings: null,
    bankAccounts: [],
    cashMovements: [],
  });

  assert.ok(
    buildMigrationRiskScore(heavy.analysis) >
      buildMigrationRiskScore(light.analysis),
  );
});

test('detects accounts payable rateType mismatches and repairable supplier-payment movements', () => {
  const inspection = inspectPurchaseRolloutReadiness({
    businessId: 'pilot-dirty',
    purchases: [],
    accountsPayablePayments: [
      {
        id: 'payment-1',
        status: 'posted',
        paymentMethods: [
          {
            method: 'cash',
            value: 50,
            cashCountId: 'cash-1',
          },
        ],
        exchangeRateSnapshot: {
          quoteCurrency: 'DOP',
          baseCurrency: 'DOP',
          rateType: 'sell',
        },
      },
    ],
    accountingSettings: {
      functionalCurrency: 'DOP',
      documentCurrencies: ['DOP'],
      bankAccountsEnabled: true,
    },
    bankAccounts: [{ id: 'bank-1', status: 'active' }],
    cashMovements: [
      {
        id: 'movement-1',
        sourceType: 'supplier_payment',
        sourceId: 'payment-1',
        method: 'cash',
        cashCountId: null,
        impactsCashDrawer: true,
        metadata: { paymentMethodIndex: 0 },
      },
    ],
  });

  assert.equal(
    inspection.analysis.accountsPayable.baseCurrencyRateTypeMismatch.count,
    1,
  );
  assert.equal(
    inspection.analysis.cashMovements.supplierPayment.repairCandidates.count,
    1,
  );
});
