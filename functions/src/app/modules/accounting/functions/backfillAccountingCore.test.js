import { describe, expect, it } from 'vitest';

import {
  buildAccountingEventRepairPatch,
  getAccountingEventRepairPlan,
  loadDefaultChartOfAccountTemplatesFromSource,
  loadDefaultPostingProfileSeedsFromSource,
  planDefaultPostingProfileChanges,
  planMissingChartAccounts,
  resolveChangedAccountingEventFields,
} from '../../../../../scripts/backfillAccountingCore.js';

const buildCanonicalAccounts = () =>
  loadDefaultChartOfAccountTemplatesFromSource().map((template) => ({
    ...template,
    id: `account_${template.systemKey}`,
  }));

describe('backfillAccountingCore planner', () => {
  it('loads the same default profile seeds used by the app', () => {
    const seeds = loadDefaultPostingProfileSeedsFromSource();
    const seedKeys = seeds.map((seed) => seed.seedKey);

    expect(seedKeys).toContain('invoice_cash_sale_bank');
    expect(seedKeys).toContain('hr_commission_accrued');
    expect(seedKeys).toContain('hr_payroll_payment_cash');
    expect(seedKeys).toContain('hr_payroll_payment_bank');
    expect(
      seeds.some(
        (seed) =>
          seed.eventType === 'hr_payroll.payment.recorded' &&
          seed.conditions?.settlementKind === 'other',
      ),
    ).toBe(false);
  });

  it('plans missing default profiles without overwriting custom profiles', () => {
    const plan = planDefaultPostingProfileChanges({
      accounts: buildCanonicalAccounts(),
      businessId: 'business-1',
      profiles: [
        {
          id: 'custom-invoice-bank',
          metadata: {
            seedKey: 'invoice_cash_sale_bank',
          },
        },
      ],
    });

    expect(
      plan.creates.some(
        (change) => change.seedKey === 'hr_commission_accrued',
      ),
    ).toBe(true);
    expect(
      plan.creates.some(
        (change) => change.seedKey === 'invoice_cash_sale_bank',
      ),
    ).toBe(false);
    expect(plan.skippedCustom).toContainEqual(
      expect.objectContaining({
        profileId: 'custom-invoice-bank',
        seedKey: 'invoice_cash_sale_bank',
      }),
    );
  });

  it('updates seed-key-only profiles when explicitly requested', () => {
    const plan = planDefaultPostingProfileChanges({
      accounts: buildCanonicalAccounts(),
      businessId: 'business-1',
      includeSeedKeyOnly: true,
      profiles: [
        {
          id: 'legacy-expense-bank',
          ref: { id: 'legacy-expense-bank' },
          metadata: {
            seedKey: 'expense_bank',
            seededBy: 'codex_2026_04_07',
          },
          linesTemplate: [
            {
              side: 'debit',
              accountSystemKey: 'operating_expenses',
              amountSource: 'expense_total',
            },
          ],
        },
      ],
    });

    expect(plan.skippedCustom).toEqual([]);
    expect(plan.updates).toContainEqual(
      expect.objectContaining({
        seedKey: 'expense_bank',
      }),
    );
    expect(
      plan.updates
        .find((change) => change.seedKey === 'expense_bank')
        ?.payload.linesTemplate.some(
          (line) => line.amountSource === 'expense_tax',
        ),
    ).toBe(true);
  });

  it('deactivates managed legacy purchase profiles replaced by default profiles', () => {
    const plan = planDefaultPostingProfileChanges({
      accounts: buildCanonicalAccounts(),
      businessId: 'business-1',
      profiles: [
        {
          id: 'purchaseCommittedCash20260407',
          ref: { id: 'purchaseCommittedCash20260407' },
          status: 'active',
          eventType: 'purchase.committed',
          metadata: {
            seedKey: 'purchase_committed_cash',
            seededBy: 'codex_2026_04_07',
          },
        },
      ],
    });

    expect(plan.deactivations).toContainEqual(
      expect.objectContaining({
        profileId: 'purchaseCommittedCash20260407',
        seedKey: 'purchase_committed_cash',
        payload: expect.objectContaining({
          status: 'inactive',
        }),
      }),
    );
  });

  it('plans updates for default profiles that still point withholdings to tax payable', () => {
    const plan = planDefaultPostingProfileChanges({
      accounts: buildCanonicalAccounts(),
      businessId: 'business-1',
      profiles: [
        {
          id: 'purchase_committed_inventory',
          ref: { id: 'purchase_committed_inventory' },
          eventType: 'purchase.committed',
          metadata: {
            seedKey: 'purchase_committed_inventory',
            seededBy: 'default_posting_profiles',
          },
          linesTemplate: [
            {
              side: 'credit',
              accountSystemKey: 'tax_payable',
              amountSource: 'purchase_withholding_itbis',
            },
          ],
        },
      ],
    });

    const update = plan.updates.find(
      (change) => change.seedKey === 'purchase_committed_inventory',
    );

    expect(update).toBeTruthy();
    expect(
      update?.payload.linesTemplate.some(
        (line) =>
          line.accountSystemKey === 'withholding_itbis_payable' &&
          line.amountSource === 'purchase_withholding_itbis',
      ),
    ).toBe(true);
    expect(
      update?.payload.linesTemplate.some(
        (line) =>
          line.accountSystemKey === 'withholding_isr_payable' &&
          line.amountSource === 'purchase_withholding_isr',
      ),
    ).toBe(true);
  });

  it('treats reordered default profile conditions as already current', () => {
    const profilePlan = planDefaultPostingProfileChanges({
      accounts: buildCanonicalAccounts(),
      businessId: 'business-1',
      profiles: [
        {
          id: 'invoice_cash_sale_bank',
          ref: { id: 'invoice_cash_sale_bank' },
          businessId: 'business-1',
          name: 'Venta al contado por banco',
          description: 'Factura confirmada y cobrada directamente por banco.',
          eventType: 'invoice.committed',
          moduleKey: 'sales',
          priority: 15,
          status: 'active',
          conditions: {
            settlementKind: 'bank',
            taxTreatment: 'any',
            paymentTerm: 'cash',
          },
          linesTemplate: [
            {
              side: 'debit',
              accountId: 'account_bank',
              accountSystemKey: 'bank',
              amountSource: 'document_total',
            },
            {
              side: 'credit',
              accountId: 'account_sales',
              accountSystemKey: 'sales',
              amountSource: 'net_sales',
            },
            {
              side: 'credit',
              accountId: 'account_tax_payable',
              accountSystemKey: 'tax_payable',
              amountSource: 'tax_total',
            },
          ],
          metadata: {
            seedKey: 'invoice_cash_sale_bank',
            seededBy: 'default_posting_profiles',
          },
        },
      ],
    });

    expect(
      profilePlan.updates.some(
        (change) => change.seedKey === 'invoice_cash_sale_bank',
      ),
    ).toBe(false);
    expect(
      profilePlan.alreadyCurrent.some(
        (profile) => profile.seedKey === 'invoice_cash_sale_bank',
      ),
    ).toBe(true);
  });

  it('does not create duplicate chart accounts when the code exists without a system key', () => {
    const plan = planMissingChartAccounts({
      accounts: [
        {
          id: 'legacy-2210',
          code: '2210',
          name: 'Legacy withholding',
        },
      ],
      businessId: 'business-1',
      templates: [
        {
          code: '2210',
          name: 'Retenciones ITBIS por pagar',
          type: 'liability',
          postingAllowed: true,
          normalSide: 'credit',
          currencyMode: 'functional_only',
          systemKey: 'withholding_itbis_payable',
          parentCode: '2000',
        },
      ],
    });

    expect(plan.writes).toHaveLength(0);
    expect(plan.skippedExistingCodeMissingSystemKey).toContainEqual({
      code: '2210',
      existingAccountId: 'legacy-2210',
      systemKey: 'withholding_itbis_payable',
    });
  });

  it('plans accounting event repairs without overwriting projection state', () => {
    const rebuiltEvent = {
      id: 'purchase.committed__purchase-1',
      eventType: 'purchase.committed',
      eventVersion: 1,
      status: 'recorded',
      sourceType: 'purchase',
      sourceId: 'purchase-1',
      sourceDocumentType: 'purchase',
      sourceDocumentId: 'purchase-1',
      monetary: {
        amount: 1180,
        subtotalAmount: 1000,
        taxAmount: 180,
        netPayableAmount: 1180,
      },
      payload: {
        fiscalTotals: {
          subtotal: 1000,
          taxAmount: 180,
          total: 1180,
          netPayableAmount: 1180,
        },
      },
      projection: {
        status: 'pending',
      },
    };
    const currentEvent = {
      ...rebuiltEvent,
      monetary: {
        amount: 0,
      },
      payload: {},
      projection: {
        status: 'failed',
        attemptCount: 5,
      },
    };

    const plan = getAccountingEventRepairPlan({
      currentEvent,
      eventRef: { id: rebuiltEvent.id },
      rebuiltEvent,
      sourceCollection: 'purchases',
      sourceId: 'purchase-1',
    });

    expect(plan).toMatchObject({
      eventId: 'purchase.committed__purchase-1',
      repairType: 'update',
      shouldRepair: true,
      changedFields: expect.arrayContaining(['monetary', 'payload']),
    });
    expect(plan.patch).not.toHaveProperty('projection');
    expect(plan.patch).toMatchObject({
      monetary: rebuiltEvent.monetary,
      payload: rebuiltEvent.payload,
    });
  });

  it('detects current rebuilt accounting events as unchanged', () => {
    const rebuiltEvent = {
      id: 'expense.recorded__expense-1',
      eventType: 'expense.recorded',
      eventVersion: 1,
      status: 'recorded',
      sourceType: 'expense',
      sourceId: 'expense-1',
      sourceDocumentType: 'expense',
      sourceDocumentId: 'expense-1',
      monetary: {
        amount: 100,
      },
      payload: {
        fiscalTotals: {
          total: 100,
        },
      },
      projection: {
        status: 'failed',
      },
    };

    expect(
      resolveChangedAccountingEventFields({
        currentEvent: rebuiltEvent,
        rebuiltEvent: {
          ...rebuiltEvent,
          projection: {
            status: 'pending',
          },
        },
      }),
    ).toEqual([]);
    expect(buildAccountingEventRepairPatch(rebuiltEvent)).not.toHaveProperty(
      'projection',
    );
  });
});
