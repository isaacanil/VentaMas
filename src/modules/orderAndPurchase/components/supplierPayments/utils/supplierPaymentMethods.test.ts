import { describe, expect, it } from 'vitest';

import {
  getSupplierPaymentSubmissionMethods,
  normalizeSupplierCreditNotes,
  resolveSupplierPaymentFiscalSettlement,
  validateSupplierPaymentMethods,
  type SupplierPaymentMethodDraft,
} from './supplierPaymentMethods';

const buildMethod = (
  overrides: Partial<SupplierPaymentMethodDraft>,
): SupplierPaymentMethodDraft => ({
  method: 'cash',
  status: false,
  value: 0,
  reference: '',
  bankAccountId: null,
  cashAccountId: null,
  cashCountId: null,
  supplierCreditNoteId: null,
  ...overrides,
});

describe('supplierPaymentMethods', () => {
  it('normalizes bank references before submitting supplier payments', () => {
    const methods = [
      buildMethod({
        method: 'transfer',
        status: true,
        value: 125,
        reference: '  TX-9981  ',
        bankAccountId: 'bank-1',
      }),
    ];

    expect(getSupplierPaymentSubmissionMethods(methods)).toEqual([
      expect.objectContaining({
        method: 'transfer',
        reference: 'TX-9981',
        bankAccountId: 'bank-1',
      }),
    ]);
  });

  it('requires reference or voucher for card and transfer payments', () => {
    const methods = [
      buildMethod({
        method: 'card',
        status: true,
        value: 125,
        bankAccountId: 'bank-1',
        reference: '   ',
      }),
    ];

    expect(validateSupplierPaymentMethods(methods)).toBe(
      'Ingrese una referencia o comprobante para tarjeta o transferencia.',
    );
  });

  it('accepts bank supplier payments when account and reference are present', () => {
    const methods = [
      buildMethod({
        method: 'transfer',
        status: true,
        value: 125,
        bankAccountId: 'bank-1',
        reference: 'ACH-2026-001',
      }),
    ];

    expect(validateSupplierPaymentMethods(methods, { balance: 200 })).toBeNull();
  });

  it('resolves first-payment fiscal withholding as a non-cash settlement component', () => {
    const settlement = resolveSupplierPaymentFiscalSettlement({
      balance: 1180,
      purchase: {
        id: 'purchase-1',
        completedAt: Date.parse('2026-04-12T12:00:00.000Z'),
        invoiceNumber: 'B010000001',
        monetary: {
          documentTotals: {
            total: 1180,
            gross: 1180,
            netPayableAmount: 1106,
            withholdingITBISAmount: 54,
            withholdingISRAmount: 20,
          },
        },
        paymentState: {
          status: 'unpaid',
          total: 1180,
          paid: 0,
          balance: 1180,
          paymentCount: 0,
        },
      },
    });

    expect(settlement).toEqual({
      cashRequirementAmount: 1106,
      netPayableAmount: 1106,
      settlementAmount: 1180,
      withholdingAmount: 74,
      withholdingITBISAmount: 54,
      withholdingISRAmount: 20,
      withholdingApplications: [
        {
          amount: 54,
          reference: 'B010000001',
          sourceDocumentId: 'purchase-1',
          taxPeriod: '2026-04',
          type: 'itbis',
        },
        {
          amount: 20,
          reference: 'B010000001',
          sourceDocumentId: 'purchase-1',
          taxPeriod: '2026-04',
          type: 'isr',
        },
      ],
    });
  });

  it('does not auto-apply fiscal withholding after prior supplier payments', () => {
    const settlement = resolveSupplierPaymentFiscalSettlement({
      balance: 606,
      purchase: {
        id: 'purchase-1',
        monetary: {
          documentTotals: {
            total: 1180,
            netPayableAmount: 1106,
            withholdingITBISAmount: 54,
            withholdingISRAmount: 20,
          },
        },
        paymentState: {
          status: 'partial',
          total: 1180,
          paid: 574,
          balance: 606,
          paymentCount: 1,
        },
      },
    });

    expect(settlement).toEqual(
      expect.objectContaining({
        cashRequirementAmount: 606,
        settlementAmount: 606,
        withholdingAmount: 0,
        withholdingApplications: [],
      }),
    );
  });

  it('validates payment methods against cash plus withholding settlement', () => {
    const methods = [
      buildMethod({
        method: 'cash',
        status: true,
        value: 1180,
        cashCountId: 'cash-1',
      }),
    ];

    expect(
      validateSupplierPaymentMethods(methods, {
        balance: 1180,
        settlementAdjustmentAmount: 74,
      }),
    ).toBe('El monto liquidado no puede superar el balance actual de la compra.');

    expect(
      validateSupplierPaymentMethods(
        [
          buildMethod({
            method: 'cash',
            status: true,
            value: 1106,
            cashCountId: 'cash-1',
          }),
        ],
        {
          balance: 1180,
          settlementAdjustmentAmount: 74,
        },
      ),
    ).toBeNull();
  });

  it('only exposes open supplier credit notes with available balance', () => {
    expect(
      normalizeSupplierCreditNotes([
        {
          id: 'open-note',
          businessId: 'business-1',
          supplierId: 'supplier-1',
          totalAmount: 100,
          appliedAmount: 25,
          remainingAmount: 75,
          status: 'open',
        },
        {
          id: 'draft-note',
          businessId: 'business-1',
          supplierId: 'supplier-1',
          totalAmount: 100,
          remainingAmount: 100,
          status: 'draft',
        },
        {
          id: 'applied-note-with-stale-balance',
          businessId: 'business-1',
          supplierId: 'supplier-1',
          totalAmount: 100,
          remainingAmount: 15,
          status: 'applied',
        },
        {
          id: 'missing-status-note',
          businessId: 'business-1',
          supplierId: 'supplier-1',
          totalAmount: 100,
          remainingAmount: 100,
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        id: 'open-note',
        remainingAmount: 75,
        status: 'open',
      }),
    ]);
  });

  it('does not submit supplier credit notes that are not open', () => {
    const methods = [
      buildMethod({
        method: 'supplierCreditNote',
        status: true,
        value: 50,
      }),
    ];
    const creditNotes = [
      {
        id: 'draft-note',
        businessId: 'business-1',
        supplierId: 'supplier-1',
        totalAmount: 100,
        remainingAmount: 100,
        status: 'draft',
      },
    ];

    expect(
      getSupplierPaymentSubmissionMethods(methods, {
        availableCreditNotes: creditNotes,
      }),
    ).toEqual([]);
    expect(
      validateSupplierPaymentMethods(methods, {
        availableCreditNotes: creditNotes,
      }),
    ).toBe('El suplidor no tiene saldo a favor disponible para aplicar.');
  });
});
