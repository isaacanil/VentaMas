import { describe, expect, it } from 'vitest';

import { validateDgiiMonthlyReportDataset } from './dgiiMonthlyReportValidation.service.js';

describe('dgiiMonthlyReportValidation.service', () => {
  it('valida un dataset completo para 606 sin issues', () => {
    const result = validateDgiiMonthlyReportDataset({
      reportCode: 'DGII_606',
      datasets: {
        purchases: [
          {
            businessId: 'business-1',
            issuedAt: '2026-04-01',
            documentNumber: 'PUR-1',
            counterparty: {
              id: 'supplier-1',
              identification: { number: '101010101' },
            },
            supplierId: 'supplier-1',
            documentType: 'purchase',
            taxReceipt: { ncf: 'B010100000001' },
            totals: { total: 1000 },
            taxBreakdown: { itbisTotal: 180 },
            classification: { dgii606ExpenseType: '01' },
          },
        ],
        expenses: [
          {
            businessId: 'business-1',
            issuedAt: '2026-04-01',
            documentNumber: 'EXP-1',
            counterparty: {
              id: 'supplier-2',
              identification: { number: '131313131' },
            },
            expenseType: 'general',
            taxReceipt: { ncf: 'B010100000002' },
            totals: { total: 500 },
            taxBreakdown: { itbisTotal: 90 },
            classification: { dgii606ExpenseType: '02' },
          },
        ],
        accountsPayablePayments: [
          {
            purchaseId: 'purchase-1',
            occurredAt: '2026-04-02',
            paymentMethods: [{ method: 'cash', amount: 1000 }],
            paymentStateSnapshot: { paid: 1000 },
            metadata: { appliedCreditNotes: [] },
          },
        ],
      },
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.sourceSummaries.map((summary) => summary.recordsScanned)).toEqual([
      1, 1, 1,
    ]);
  });

  it('reporta campos faltantes usando la definición del reporte 607', () => {
    const result = validateDgiiMonthlyReportDataset({
      reportCode: 'DGII_607',
      datasets: {
        invoices: [
          {
            businessId: 'business-1',
            issuedAt: '2026-04-01',
            documentNumber: 'INV-1',
            counterparty: {
              id: 'client-1',
              identification: { number: '' },
            },
            clientId: 'client-1',
            data: {},
            totals: { total: 1200 },
            status: 'issued',
          },
        ],
      },
    });

    expect(result.ok).toBe(false);
    expect(result.pendingGaps).toContain(
      'Las retenciones sufridas por terceros todavía no tienen una colección canónica dedicada en backend.',
    );
    expect(result.issues).toEqual([
      {
        sourceId: 'invoices',
        index: 0,
        fieldPath: 'counterparty.identification.number',
        code: 'missing-required-field',
        severity: 'error',
      },
      {
        sourceId: 'invoices',
        index: 0,
        fieldPath: 'data.NCF',
        code: 'missing-required-field',
        severity: 'error',
      },
      {
        sourceId: 'invoices',
        index: 0,
        fieldPath: 'totals.tax',
        code: 'missing-required-field',
        severity: 'error',
      },
    ]);
  });

  it('falla si el código de reporte no existe', () => {
    expect(() =>
      validateDgiiMonthlyReportDataset({
        reportCode: 'DGII_IR2',
        datasets: {},
      }),
    ).toThrow('Reporte DGII no soportado: DGII_IR2');
  });
});
