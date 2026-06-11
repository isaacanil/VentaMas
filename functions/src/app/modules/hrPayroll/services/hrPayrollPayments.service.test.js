import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../core/config/firebase.js', () => ({
  FieldValue: {
    serverTimestamp: () => 'server-timestamp',
  },
}));

import {
  buildHrPayrollPaymentAggregateStatusPatch,
  buildHrPayrollPaymentCashMovements,
  buildHrPayrollPaymentDocuments,
  normalizeHrPayrollPaymentMethodCode,
  resolveHrPayrollPaymentChannel,
} from './hrPayrollPayments.service.js';

const approvedLine = {
  id: 'line-1',
  businessId: 'business-1',
  periodId: 'period-1',
  payrollRunId: 'run-1',
  employeeId: 'emp-1',
  employeeCode: 'EMP-001',
  employeeNameSnapshot: 'Ana Perez',
  partyId: 'party-1',
  status: 'approved',
  currency: 'DOP',
  netAmount: 125,
  commissionAmount: 125,
  commissionEntryIds: ['entry-1', 'entry-2'],
};

describe('hrPayrollPayments.service', () => {
  it('normalizes check and transfer as bank-channel payments', () => {
    expect(normalizeHrPayrollPaymentMethodCode('bank_transfer')).toBe(
      'transfer',
    );
    expect(normalizeHrPayrollPaymentMethodCode('check')).toBe('transfer');
    expect(resolveHrPayrollPaymentChannel('check')).toBe('bank');
    expect(resolveHrPayrollPaymentChannel('cash')).toBe('cash');
  });

  it('builds a confirmed payment, accounting event and cash movement', () => {
    const result = buildHrPayrollPaymentDocuments({
      businessId: 'business-1',
      line: approvedLine,
      payload: {
        paymentMethod: 'cash',
        reference: 'REC-001',
        cashCountId: 'cash-count-1',
        cashAccountId: 'cash-account-1',
      },
      paymentDate: 'payment-date',
      timestamp: 'now',
      userId: 'admin-1',
    });

    expect(result.ok).toBe(true);
    expect(result.payment).toMatchObject({
      id: 'hrpay_line-1',
      amount: 125,
      status: 'confirmed',
      paymentMethod: 'cash',
      paymentChannel: 'cash',
      reference: 'REC-001',
      accountingEventId: 'hr_payroll.payment.recorded__hrpay_line-1',
      cashMovementIds: ['hrp_hrpay_line-1_cash_1'],
    });
    expect(result.accountingEvent).toMatchObject({
      id: 'hr_payroll.payment.recorded__hrpay_line-1',
      eventType: 'hr_payroll.payment.recorded',
      counterpartyType: 'employee',
      counterpartyId: 'emp-1',
      treasury: {
        cashAccountId: 'cash-account-1',
        cashCountId: 'cash-count-1',
        paymentChannel: 'cash',
      },
      monetary: {
        amount: 125,
        functionalAmount: 125,
      },
      payload: {
        settlementKind: 'cash',
        payrollLineId: 'line-1',
        employeeCode: 'EMP-001',
      },
    });
    expect(result.cashMovements).toEqual([
      expect.objectContaining({
        id: 'hrp_hrpay_line-1_cash_1',
        direction: 'out',
        sourceType: 'hr_payroll_payment',
        method: 'cash',
        amount: 125,
        counterpartyType: 'employee',
        counterpartyId: 'emp-1',
        impactsCashDrawer: true,
        impactsBankLedger: false,
      }),
    ]);
    expect(result.linePatch).toMatchObject({
      status: 'paid',
      employeePaymentId: 'hrpay_line-1',
      paymentAccountingEventId: 'hr_payroll.payment.recorded__hrpay_line-1',
    });
    expect(result.entryPatch).toMatchObject({
      status: 'paid',
      employeePaymentId: 'hrpay_line-1',
    });
  });

  it('skips cash movements for unsupported other payment methods', () => {
    const cashMovements = buildHrPayrollPaymentCashMovements({
      businessId: 'business-1',
      payment: {
        id: 'payment-1',
        amount: 50,
        paymentMethods: [{ method: 'other', amount: 50 }],
      },
      createdAt: 'now',
    });

    expect(cashMovements).toEqual([]);
  });

  it('rejects unsupported payments without accounting support', () => {
    expect(
      buildHrPayrollPaymentDocuments({
        businessId: 'business-1',
        line: approvedLine,
        payload: { paymentMethod: 'other' },
      }),
    ).toMatchObject({
      ok: false,
      error:
        'Selecciona caja, transferencia o cheque para registrar un pago de nomina con soporte contable.',
    });

    expect(
      buildHrPayrollPaymentDocuments({
        businessId: 'business-1',
        line: approvedLine,
        payload: { paymentMethod: 'bank_transfer' },
      }),
    ).toMatchObject({
      ok: false,
      error: 'Indica la cuenta bancaria operativa antes de confirmar el pago.',
    });

    expect(
      buildHrPayrollPaymentDocuments({
        businessId: 'business-1',
        line: approvedLine,
        payload: { paymentMethod: 'cash', cashAccountId: 'cash-account-1' },
      }),
    ).toMatchObject({
      ok: false,
      error:
        'Indica la caja y el cuadre operativo para registrar este pago en efectivo.',
    });
  });

  it('rejects draft lines and partial line payments for the MVP', () => {
    expect(
      buildHrPayrollPaymentDocuments({
        businessId: 'business-1',
        line: { ...approvedLine, status: 'draft' },
      }),
    ).toMatchObject({
      ok: false,
      error: 'La linea debe estar aprobada y pendiente de pago.',
    });

    expect(
      buildHrPayrollPaymentDocuments({
        businessId: 'business-1',
        line: approvedLine,
        payload: { amount: 100 },
      }),
    ).toMatchObject({
      ok: false,
      error:
        'Por ahora el MVP solo permite pagar el neto completo de la linea.',
    });
  });

  it('marks aggregate status as partially paid until all lines are paid', () => {
    expect(
      buildHrPayrollPaymentAggregateStatusPatch({
        currentLineId: 'line-1',
        employeeLines: [
          { id: 'line-1', status: 'approved', netAmount: 125 },
          { id: 'line-2', status: 'approved', netAmount: 50 },
        ],
        paymentId: 'hrpay_line-1',
        timestamp: 'now',
        userId: 'admin-1',
      }),
    ).toMatchObject({
      status: 'partially_paid',
      paidAmount: 125,
      paidLinesCount: 1,
      lastPaymentId: 'hrpay_line-1',
    });

    expect(
      buildHrPayrollPaymentAggregateStatusPatch({
        currentLineId: 'line-2',
        employeeLines: [
          { id: 'line-1', status: 'paid', netAmount: 125 },
          { id: 'line-2', status: 'approved', netAmount: 50 },
        ],
        paymentId: 'hrpay_line-2',
        timestamp: 'now',
        userId: 'admin-1',
      }),
    ).toMatchObject({
      status: 'paid',
      paidAmount: 175,
      paidLinesCount: 2,
      lastPaymentId: 'hrpay_line-2',
    });
  });
});
