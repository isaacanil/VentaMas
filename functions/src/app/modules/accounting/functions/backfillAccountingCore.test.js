import { describe, expect, it } from 'vitest';

import {
  loadDefaultChartOfAccountTemplatesFromSource,
  loadDefaultPostingProfileSeedsFromSource,
  planDefaultPostingProfileChanges,
  planMissingChartAccounts,
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
});
