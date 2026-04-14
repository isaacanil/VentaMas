import { describe, expect, it } from 'vitest';

import {
  buildAccountsPayableRow,
  buildAccountsPayableSummary,
  matchesAccountsPayableTraceabilityFilter,
  resolveAccountsPayableAgingSnapshot,
} from './accountsPayableDashboard';

import type { Purchase } from '@/utils/purchase/types';
import type { VendorBill } from '@/utils/vendorBills/types';

const buildVendorBill = ({
  purchase,
  paymentState,
  attachmentUrls = [],
}: {
  purchase?: Partial<Purchase>;
  paymentState?: Record<string, unknown>;
  attachmentUrls?: Array<{ id: string }>;
} = {}): VendorBill => {
  const resolvedPaymentState = (paymentState ?? {
    status: 'partial',
    total: 1000,
    paid: 0,
    balance: 1000,
  }) as VendorBill['paymentState'];
  const dueAt = resolvedPaymentState?.nextPaymentAt ?? null;

  return {
    id: `purchase:${purchase?.id ?? 'purchase-1'}`,
    reference: String(purchase?.numberId ?? 'PO-1'),
    status: 'partially_paid',
    approvalStatus: 'approved',
    sourceDocumentType: 'purchase',
    sourceDocumentId: purchase?.id ?? 'purchase-1',
    supplierId: 'provider-1',
    supplierName:
      typeof purchase?.provider === 'object' && purchase?.provider?.name
        ? purchase.provider.name
        : 'Proveedor Uno',
    attachmentUrls,
    dueAt,
    paymentTerms: dueAt
      ? {
          condition: 'thirty_days',
          expectedPaymentAt: dueAt,
          nextPaymentAt: dueAt,
        }
      : null,
    paymentState: resolvedPaymentState,
    purchase: {
      id: 'purchase-1',
      numberId: 'PO-1',
      workflowStatus: 'completed',
      ...purchase,
    } as Purchase,
  };
};

describe('accountsPayableDashboard', () => {
  it('classifies current balances that are not overdue', () => {
    const vendorBill = buildVendorBill({
      paymentState: {
        status: 'partial',
        total: 1000,
        paid: 200,
        balance: 800,
        nextPaymentAt: new Date('2026-04-10T10:00:00.000Z'),
      },
    });

    expect(
      resolveAccountsPayableAgingSnapshot(
        vendorBill,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
    ).toMatchObject({
      bucket: 'current',
      tone: 'warning',
    });
  });

  it('classifies overdue balances into aging buckets', () => {
    const vendorBill = buildVendorBill({
      purchase: {
        id: 'purchase-2',
        numberId: 'PO-2',
      },
      paymentState: {
        status: 'partial',
        total: 1000,
        paid: 100,
        balance: 900,
        nextPaymentAt: new Date('2026-02-10T10:00:00.000Z'),
      },
    });

    expect(
      resolveAccountsPayableAgingSnapshot(
        vendorBill,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
    ).toMatchObject({
      bucket: 'due_31_60',
      tone: 'danger',
    });
  });

  it('builds a row with traceability counters', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-3',
          numberId: 'PO-3',
          provider: {
            name: 'Proveedor Uno',
          },
        },
        attachmentUrls: [{ id: 'file-1' }, { id: 'file-2' }],
      paymentState: {
        status: 'partial',
          total: 1000,
          paid: 250,
          balance: 750,
          paymentCount: 2,
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(row).toMatchObject({
      providerName: 'Proveedor Uno',
      evidenceCount: 2,
      paymentCount: 2,
      traceabilitySummary: '2 pagos · 2 evidencias',
    });
  });

  it('builds summary totals by aging bucket', () => {
    const rows = [
      buildAccountsPayableRow(
        buildVendorBill({
          paymentState: {
            status: 'partial',
            total: 1000,
            paid: 0,
            balance: 1000,
            nextPaymentAt: new Date('2026-04-10T10:00:00.000Z'),
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
      buildAccountsPayableRow(
        buildVendorBill({
          purchase: {
            id: 'purchase-2',
          },
          paymentState: {
            status: 'partial',
            total: 1000,
            paid: 200,
            balance: 800,
            nextPaymentAt: new Date('2026-04-05T10:00:00.000Z'),
          },
          attachmentUrls: [{ id: 'file-1' }],
        }),
        undefined,
        new Date('2026-04-25T12:00:00.000Z').getTime(),
      ),
    ];

    const summary = buildAccountsPayableSummary(rows);

    expect(summary.totalCount).toBe(2);
    expect(summary.totalBalanceAmount).toBe(1800);
    expect(summary.totalWithEvidence).toBe(1);
    expect(summary.buckets.find((bucket) => bucket.key === 'current')?.count).toBe(
      1,
    );
    expect(
      summary.buckets.find((bucket) => bucket.key === 'due_1_30')?.count,
    ).toBe(1);
  });

  it('matches traceability filters without heuristics', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-4',
        },
        attachmentUrls: [{ id: 'file-1' }],
        paymentState: {
          status: 'partial',
          total: 1000,
          paid: 500,
          balance: 500,
          paymentCount: 1,
          nextPaymentAt: new Date('2026-03-01T10:00:00.000Z'),
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(matchesAccountsPayableTraceabilityFilter(row, 'with_payments')).toBe(
      true,
    );
    expect(matchesAccountsPayableTraceabilityFilter(row, 'with_evidence')).toBe(
      true,
    );
    expect(matchesAccountsPayableTraceabilityFilter(row, 'overdue')).toBe(true);
    expect(
      matchesAccountsPayableTraceabilityFilter(row, 'missing_evidence'),
    ).toBe(false);
  });

  it('describes settled bills as paid instead of overdue', () => {
    const vendorBill = buildVendorBill({
      paymentState: {
        status: 'paid',
        total: 1000,
        paid: 1000,
        balance: 0,
        nextPaymentAt: new Date('2026-02-10T10:00:00.000Z'),
        lastPaymentAt: new Date('2026-04-05T12:00:00.000Z'),
      },
    });

    expect(
      resolveAccountsPayableAgingSnapshot(
        vendorBill,
        new Date('2026-04-06T12:00:00.000Z').getTime(),
      ),
    ).toMatchObject({
      bucket: 'current',
      tone: 'warning',
      label: 'Pagada con 54 días de atraso',
    });
  });
});
