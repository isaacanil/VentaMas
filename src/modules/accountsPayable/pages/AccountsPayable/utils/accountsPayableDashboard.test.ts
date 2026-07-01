import { describe, expect, it } from 'vitest';

import {
  buildAccountsPayablePaymentChecklist,
  buildAccountsPayableRow,
  buildAccountsPayableSummary,
  filterAccountsPayableRowsByAgingBucket,
  filterAccountsPayableRowsByReviewQueue,
  filterAccountsPayableRowsByReviewScope,
  matchesAccountsPayableFiscalFilter,
  matchesAccountsPayableReviewQueue,
  matchesAccountsPayableTraceabilityFilter,
  resolveAccountsPayableAgingSnapshot,
} from './accountsPayableDashboard';

import type { Purchase } from '@/utils/purchase/types';
import type { VendorBill } from '@/domain/accountsPayable/vendorBills/types';

const buildVendorBill = ({
  purchase,
  paymentState,
  attachmentUrls = [],
  vendorBill,
}: {
  purchase?: Partial<Purchase>;
  paymentState?: Record<string, unknown>;
  attachmentUrls?: Array<{ id: string }>;
  vendorBill?: Partial<VendorBill>;
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
    status: vendorBill?.status ?? 'partially_paid',
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
    ...vendorBill,
    purchase: {
      id: 'purchase-1',
      numberId: 'PO-1',
      workflowStatus: 'completed',
      ...purchase,
      ...vendorBill?.purchase,
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
      paymentControl: {
        canRegisterPayment: true,
        label: 'Aprobada',
        status: 'payable',
      },
      paymentCount: 2,
      traceabilitySummary: '2 pagos · 2 evidencias',
    });
  });

  it('counts AP control evidence as traceability evidence', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-control-evidence',
          numberId: 'PO-CONTROL-EVIDENCE',
        },
        vendorBill: {
          approvalEvidenceUrls: [
            'https://files.example/ap-approval.pdf',
            'https://files.example/ap-approval.pdf',
          ],
          paymentHold: {
            evidenceNote: 'Pendiente recepción física',
            evidenceUrls: ['https://files.example/hold-support.pdf'],
          },
          dispute: {
            evidenceNote: 'Diferencia de precio validada',
          },
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );
    const summary = buildAccountsPayableSummary([row]);

    expect(row.evidenceCount).toBe(4);
    expect(row.traceabilitySummary).toBe('0 pagos · 4 evidencias');
    expect(summary.totalWithEvidence).toBe(1);
    expect(matchesAccountsPayableTraceabilityFilter(row, 'with_evidence')).toBe(
      true,
    );
    expect(
      matchesAccountsPayableTraceabilityFilter(row, 'missing_evidence'),
    ).toBe(false);
  });

  it('builds a fiscal snapshot from purchase and vendor bill metadata', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-fiscal',
          numberId: 'PO-FISCAL',
          completedAt: new Date('2026-04-01T10:00:00.000Z'),
          documentType: 'valid_fiscal_credit',
          invoiceNumber: 4501,
          taxReceipt: {
            ncf: 'B0100001234',
          },
          classification: {
            dgii606ExpenseType: '02',
          },
        },
        vendorBill: {
          vendorReference: 'FAC-4501',
          monetary: {
            fiscalTotals: {
              subtotal: 1000,
              taxAmount: 180,
              withholdingITBISAmount: 54,
              withholdingISRAmount: 20,
              netPayableAmount: 1106,
            },
          },
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(row.fiscalSnapshot).toMatchObject({
      vendorReference: 'FAC-4501',
      ncf: 'B0100001234',
      documentType: 'valid_fiscal_credit',
      dgii606ExpenseType: '02',
      billDate: new Date('2026-04-01T10:00:00.000Z').getTime(),
      subtotalAmount: 1000,
      taxAmount: 180,
      withholdingITBISAmount: 54,
      withholdingISRAmount: 20,
      netPayableAmount: 1106,
      fiscalLabel: 'B0100001234',
      vendorReferenceLabel: 'FAC-4501',
    });
  });

  it('builds a currency snapshot from vendor bill monetary metadata', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        vendorBill: {
          monetary: {
            documentCurrency: { code: 'USD' },
            functionalCurrency: { code: 'DOP' },
            exchangeRateSnapshot: {
              rate: 58.75,
            },
          },
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(row.currencySnapshot).toEqual({
      currency: 'USD',
      currencyLabel: 'USD -> DOP',
      exchangeRate: 58.75,
      exchangeRateLabel: '1 USD = 58.75 DOP',
      functionalCurrency: 'DOP',
    });
  });

  it('builds an accounting snapshot from vendor bill posting metadata', () => {
    const accountingDate = new Date('2026-04-01T10:00:00.000Z');
    const postedAt = new Date('2026-04-02T11:00:00.000Z');

    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-accounting',
          numberId: 'PO-ACCOUNTING',
        },
        vendorBill: {
          accountingDate,
          documentNature: 'inventory',
          postedAt,
          settlementTiming: 'deferred',
          sourceDocumentId: 'purchase-accounting',
          sourceDocumentType: 'purchase',
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(row.accountingSnapshot).toMatchObject({
      accountingDate: accountingDate.getTime(),
      documentNature: 'inventory',
      documentNatureLabel: 'Inventario',
      posted: true,
      postedAt: postedAt.getTime(),
      settlementTiming: 'deferred',
      settlementTimingLabel: 'Diferida',
      sourceDocumentId: 'purchase-accounting',
      sourceDocumentType: 'purchase',
      statusLabel: 'Contabilizada',
      statusTone: 'success',
    });
  });

  it('marks accounting snapshot as pending when no posting metadata exists', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-pending-accounting',
          numberId: 'PO-PENDING-ACCOUNTING',
        },
        vendorBill: {
          accountingDate: null,
          documentNature: null,
          postedAt: null,
          settlementTiming: null,
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(row.accountingSnapshot).toMatchObject({
      accountingDate: null,
      documentNatureLabel: 'Sin naturaleza',
      posted: false,
      postedAt: null,
      settlementTimingLabel: 'Sin liquidación',
      statusLabel: 'Pendiente contable',
      statusTone: 'warning',
    });
  });

  it('uses legacy proof of purchase as NCF fallback only', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-proof',
          numberId: 'PO-PROOF',
          proofOfPurchase: 'B0100007777',
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(row.fiscalSnapshot).toMatchObject({
      ncf: 'B0100007777',
      vendorReference: null,
      fiscalLabel: 'B0100007777',
      vendorReferenceLabel: 'Sin factura proveedor',
    });
  });

  it('matches fiscal filters for AP review queues', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-review',
          numberId: 'PO-REVIEW',
          taxReceipt: {
            ncf: 'B0100008888',
          },
          classification: {
            dgii606ExpenseType: '09',
          },
        },
        vendorBill: {
          vendorReference: 'FAC-8888',
          monetary: {
            fiscalTotals: {
              withholdingITBISAmount: 12,
              withholdingISRAmount: 3,
            },
          },
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(matchesAccountsPayableFiscalFilter(row, 'all')).toBe(true);
    expect(matchesAccountsPayableFiscalFilter(row, 'with_ncf')).toBe(true);
    expect(matchesAccountsPayableFiscalFilter(row, 'with_withholdings')).toBe(
      true,
    );
    expect(matchesAccountsPayableFiscalFilter(row, 'missing_ncf')).toBe(false);
    expect(
      matchesAccountsPayableFiscalFilter(row, 'missing_vendor_reference'),
    ).toBe(false);
    expect(
      matchesAccountsPayableFiscalFilter(row, 'missing_dgii_classification'),
    ).toBe(false);
  });

  it('matches fiscal exception filters for incomplete AP documents', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-missing-fiscal',
          numberId: 'PO-MISSING',
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(matchesAccountsPayableFiscalFilter(row, 'missing_ncf')).toBe(true);
    expect(
      matchesAccountsPayableFiscalFilter(row, 'missing_vendor_reference'),
    ).toBe(true);
    expect(
      matchesAccountsPayableFiscalFilter(row, 'missing_dgii_classification'),
    ).toBe(true);
    expect(matchesAccountsPayableFiscalFilter(row, 'with_ncf')).toBe(false);
    expect(matchesAccountsPayableFiscalFilter(row, 'with_withholdings')).toBe(
      false,
    );
  });

  it('marks held accounts payable rows as blocked for payment with reason', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        vendorBill: {
          status: 'on_hold',
          paymentHold: {
            active: true,
            reason: 'Esperando evidencia fiscal',
          },
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(row.paymentControl).toEqual({
      canRegisterPayment: false,
      label: 'Retenida',
      reason: 'Esperando evidencia fiscal',
      status: 'on_hold',
      tone: 'warning',
    });
  });

  it('marks disputed accounts payable rows as blocked before payment', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        vendorBill: {
          dispute: {
            status: 'open',
            reason: 'Monto facturado no coincide',
          },
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(row.paymentControl).toEqual({
      canRegisterPayment: false,
      label: 'En disputa',
      reason: 'Monto facturado no coincide',
      status: 'disputed',
      tone: 'danger',
    });
  });

  it('marks non approved accounts payable rows as blocked for payment', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        vendorBill: {
          approvalStatus: 'pending_approval',
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(row.paymentControl).toMatchObject({
      canRegisterPayment: false,
      label: 'No aprobada',
      status: 'pending_approval',
    });
  });

  it('uses persisted payment control snapshot before legacy heuristics', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        vendorBill: {
          paymentControl: {
            canRegisterPayment: false,
            label: 'Retenida por tesorería',
            reason: 'Esperando contrato firmado',
            status: 'on_hold',
            tone: 'warning',
          },
          paymentHold: null,
          status: 'approved',
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(row.paymentControl).toEqual({
      canRegisterPayment: false,
      label: 'Retenida por tesorería',
      reason: 'Esperando contrato firmado',
      status: 'on_hold',
      tone: 'warning',
    });
  });

  it('marks closed vendor bill snapshots as non payable even with visible balance', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        vendorBill: {
          paymentControl: {
            canRegisterPayment: false,
            status: 'closed',
          },
          status: 'paid',
        },
        paymentState: {
          status: 'paid',
          total: 1000,
          paid: 1000,
          balance: 50,
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    expect(row.paymentControl).toEqual({
      canRegisterPayment: false,
      label: 'Cerrada',
      reason: null,
      status: 'closed',
      tone: 'neutral',
    });
  });

  it('builds a ready-to-pay checklist from supplier, fiscal and receipt signals', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-ready-checklist',
          provider: {
            id: 'provider-1',
            name: 'Proveedor Uno',
            rnc: '101123456',
            voucherType: '01',
          },
          receiptInventoryState: {
            status: 'applied',
            warehouseId: 'main',
          },
          taxReceipt: {
            ncf: 'B0100001234',
          },
          documentType: 'valid_fiscal_credit',
          classification: {
            dgii606ExpenseType: '02',
          },
        },
        paymentState: {
          status: 'partial',
          total: 1200,
          paid: 100,
          balance: 1100,
          nextPaymentAt: new Date('2026-04-15T10:00:00.000Z'),
        },
        vendorBill: {
          vendorReference: 'FAC-1234',
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    const checklist = buildAccountsPayablePaymentChecklist(row);

    expect(checklist).toMatchObject({
      label: 'Listo para pagar',
      tone: 'success',
    });
    expect(checklist.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'supplier',
          statusLabel: 'Ficha vinculada',
          tone: 'success',
        }),
        expect.objectContaining({
          key: 'fiscal',
          statusLabel: 'Fiscal validado',
          tone: 'success',
        }),
        expect.objectContaining({
          key: 'receipt',
          detail: 'Recepción completa · Inventario aplicado · Almacén main',
          statusLabel: 'Recepción completa',
          tone: 'success',
        }),
        expect.objectContaining({
          key: 'control',
          detail: 'Balance abierto $1,100.00',
          statusLabel: 'Aprobada',
          tone: 'success',
        }),
      ]),
    );
  });

  it('marks stale receipt or inventory states as blocking before payment', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-inventory-pending',
          receiptInventoryState: {
            status: 'pending_inventory',
          },
          taxReceipt: {
            ncf: 'B0100007777',
          },
          classification: {
            dgii606ExpenseType: '02',
          },
        },
        vendorBill: {
          vendorReference: 'FAC-7777',
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    const checklist = buildAccountsPayablePaymentChecklist(row);

    expect(checklist).toMatchObject({
      label: 'Bloqueado para pago',
      tone: 'danger',
    });
    expect(checklist.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'receipt',
          statusLabel: 'Inventario pendiente',
          tone: 'danger',
        }),
      ]),
    );
  });

  it('treats overdue payable rows as review priority, not payment-blocked', () => {
    const row = buildAccountsPayableRow(
      buildVendorBill({
        purchase: {
          id: 'purchase-overdue-checklist',
          receiptInventoryState: {
            status: 'applied',
          },
          taxReceipt: {
            ncf: 'B0100005555',
          },
          classification: {
            dgii606ExpenseType: '02',
          },
        },
        paymentState: {
          status: 'partial',
          total: 1000,
          paid: 0,
          balance: 1000,
          nextPaymentAt: new Date('2026-03-15T10:00:00.000Z'),
        },
        vendorBill: {
          vendorReference: 'FAC-5555',
        },
      }),
      undefined,
      new Date('2026-04-05T12:00:00.000Z').getTime(),
    );

    const checklist = buildAccountsPayablePaymentChecklist(row);

    expect(checklist).toMatchObject({
      label: 'Requiere revisión',
      tone: 'warning',
    });
    expect(checklist.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'due_date',
          statusLabel: 'Vencido',
          tone: 'danger',
        }),
        expect.objectContaining({
          key: 'control',
          statusLabel: 'Aprobada',
          tone: 'success',
        }),
      ]),
    );
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
    expect(
      summary.buckets.find((bucket) => bucket.key === 'current')?.count,
    ).toBe(1);
    expect(
      summary.buckets.find((bucket) => bucket.key === 'due_1_30')?.count,
    ).toBe(1);
  });

  it('builds managerial review queues for approval, holds, disputes and fiscal gaps', () => {
    const rows = [
      buildAccountsPayableRow(
        buildVendorBill({
          purchase: {
            id: 'purchase-pending-approval-summary',
          },
          paymentState: {
            status: 'partial',
            total: 500,
            paid: 0,
            balance: 500,
          },
          vendorBill: {
            approvalStatus: 'pending_approval',
            vendorReference: 'FAC-APP',
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
      buildAccountsPayableRow(
        buildVendorBill({
          purchase: {
            id: 'purchase-held-summary',
            taxReceipt: {
              ncf: 'B0100002200',
            },
            classification: {
              dgii606ExpenseType: '02',
            },
          },
          paymentState: {
            status: 'partial',
            total: 700,
            paid: 0,
            balance: 700,
          },
          vendorBill: {
            paymentControl: {
              canRegisterPayment: false,
              status: 'on_hold',
            },
            vendorReference: 'FAC-HOLD',
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
      buildAccountsPayableRow(
        buildVendorBill({
          purchase: {
            id: 'purchase-disputed-summary',
            taxReceipt: {
              ncf: 'B0100003300',
            },
            classification: {
              dgii606ExpenseType: '02',
            },
          },
          paymentState: {
            status: 'partial',
            total: 900,
            paid: 0,
            balance: 900,
          },
          vendorBill: {
            dispute: {
              active: true,
              reason: 'Monto no coincide',
            },
            vendorReference: 'FAC-DISPUTE',
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
    ];

    const summary = buildAccountsPayableSummary(rows);

    expect(summary.reviewQueues).toEqual([
      expect.objectContaining({
        balanceAmount: 500,
        count: 1,
        key: 'pending_approval',
      }),
      expect.objectContaining({
        balanceAmount: 700,
        count: 1,
        key: 'on_hold',
      }),
      expect.objectContaining({
        balanceAmount: 900,
        count: 1,
        key: 'disputed',
      }),
      expect.objectContaining({
        balanceAmount: 500,
        count: 1,
        key: 'fiscal_review',
      }),
    ]);
  });

  it('filters visible rows by managerial review queue', () => {
    const rows = [
      buildAccountsPayableRow(
        buildVendorBill({
          purchase: {
            id: 'purchase-payable-complete',
            taxReceipt: {
              ncf: 'B0100001000',
            },
            classification: {
              dgii606ExpenseType: '02',
            },
          },
          vendorBill: {
            vendorReference: 'FAC-1000',
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
      buildAccountsPayableRow(
        buildVendorBill({
          purchase: {
            id: 'purchase-held-queue',
            numberId: 'PO-HOLD',
            taxReceipt: {
              ncf: 'B0100002000',
            },
            classification: {
              dgii606ExpenseType: '02',
            },
          },
          vendorBill: {
            paymentControl: {
              canRegisterPayment: false,
              status: 'on_hold',
            },
            vendorReference: 'FAC-HOLD',
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
      buildAccountsPayableRow(
        buildVendorBill({
          purchase: {
            id: 'purchase-fiscal-queue',
            numberId: 'PO-FISCAL',
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
    ];

    expect(matchesAccountsPayableReviewQueue(rows[1], 'on_hold')).toBe(true);
    expect(matchesAccountsPayableReviewQueue(rows[0], 'on_hold')).toBe(false);
    expect(matchesAccountsPayableReviewQueue(rows[2], 'fiscal_review')).toBe(
      true,
    );
    expect(
      filterAccountsPayableRowsByReviewQueue(rows, 'on_hold').map(
        (row) => row.reference,
      ),
    ).toEqual(['PO-HOLD']);
    expect(
      filterAccountsPayableRowsByReviewQueue(rows, 'fiscal_review').map(
        (row) => row.reference,
      ),
    ).toEqual(['PO-FISCAL']);
    expect(filterAccountsPayableRowsByReviewQueue(rows, 'all')).toHaveLength(3);
  });

  it('keeps AP summary scoped to fiscal and traceability filters before aging buckets', () => {
    const reviewRows = [
      buildAccountsPayableRow(
        buildVendorBill({
          purchase: {
            id: 'purchase-complete',
            numberId: 'PO-COMPLETE',
            taxReceipt: {
              ncf: 'B0100001000',
            },
          },
          attachmentUrls: [{ id: 'file-1' }],
          paymentState: {
            status: 'partial',
            total: 1000,
            paid: 0,
            balance: 1000,
            nextPaymentAt: new Date('2026-04-10T10:00:00.000Z'),
          },
          vendorBill: {
            vendorReference: 'FAC-1000',
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
      buildAccountsPayableRow(
        buildVendorBill({
          purchase: {
            id: 'purchase-missing-overdue',
            numberId: 'PO-MISSING-OVERDUE',
          },
          paymentState: {
            status: 'partial',
            total: 900,
            paid: 100,
            balance: 800,
            nextPaymentAt: new Date('2026-03-20T10:00:00.000Z'),
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
      buildAccountsPayableRow(
        buildVendorBill({
          purchase: {
            id: 'purchase-missing-current',
            numberId: 'PO-MISSING-CURRENT',
          },
          paymentState: {
            status: 'partial',
            total: 700,
            paid: 0,
            balance: 700,
            nextPaymentAt: new Date('2026-04-20T10:00:00.000Z'),
          },
        }),
        undefined,
        new Date('2026-04-05T12:00:00.000Z').getTime(),
      ),
    ];

    const scopedRows = filterAccountsPayableRowsByReviewScope(reviewRows, {
      fiscalFilter: 'missing_ncf',
      traceabilityFilter: 'missing_evidence',
    });
    const scopedSummary = buildAccountsPayableSummary(scopedRows);
    const agingRows = filterAccountsPayableRowsByAgingBucket(
      scopedRows,
      'due_1_30',
    );

    expect(scopedRows.map((row) => row.reference)).toEqual([
      'PO-MISSING-OVERDUE',
      'PO-MISSING-CURRENT',
    ]);
    expect(scopedSummary.totalCount).toBe(2);
    expect(scopedSummary.totalBalanceAmount).toBe(1500);
    expect(
      scopedSummary.buckets.find((bucket) => bucket.key === 'current')?.count,
    ).toBe(1);
    expect(
      scopedSummary.buckets.find((bucket) => bucket.key === 'due_1_30')?.count,
    ).toBe(1);
    expect(agingRows.map((row) => row.reference)).toEqual([
      'PO-MISSING-OVERDUE',
    ]);
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
