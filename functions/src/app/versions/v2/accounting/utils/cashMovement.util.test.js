import { describe, expect, it } from 'vitest';

import {
  buildAccountsPayablePaymentCashMovementId,
  buildAccountsPayablePaymentCashMovements,
  buildExpenseCashMovement,
  buildExpenseCashMovementId,
  buildInternalTransferCashMovementId,
  buildInternalTransferCashMovements,
  buildInvoicePosCashMovementId,
  buildInvoicePosCashMovements,
  buildReceivablePaymentCashMovementId,
  buildReceivablePaymentCashMovements,
  buildReceivablePaymentVoidCashMovementId,
  buildReceivablePaymentVoidCashMovements,
} from './cashMovement.util.js';

describe('cashMovement.util', () => {
  it('builds deterministic ids per payment method', () => {
    expect(buildReceivablePaymentCashMovementId('pay_1', 'card', 0)).toBe(
      'arp_pay_1_card_1',
    );
    expect(
      buildAccountsPayablePaymentCashMovementId('pay_sup_1', 'transfer', 0),
    ).toBe('app_pay_sup_1_transfer_1');
    expect(buildInvoicePosCashMovementId('inv_1', 'transfer', 1)).toBe(
      'inv_inv_1_transfer_2',
    );
    expect(buildExpenseCashMovementId('exp_1')).toBe('exp_exp_1');
    expect(buildReceivablePaymentVoidCashMovementId('pay_1', 'cash', 0)).toBe(
      'arpv_pay_1_cash_1',
    );
    expect(buildInternalTransferCashMovementId('trf_1', 'out')).toBe(
      'itf_trf_1_out',
    );
  });

  it('creates one movement per supported method and skips non-cash impacts', () => {
    const createdAt = new Date('2026-03-17T10:00:00.000Z');

    const result = buildReceivablePaymentCashMovements({
      businessId: 'biz_1',
      cashCountId: 'cash_1',
      clientId: 'client_1',
      createdAt,
      createdBy: 'user_1',
      payment: {
        id: 'pay_1',
        arId: 'ar_1',
        paymentScope: 'account',
        paymentOption: 'partial',
      },
      paymentMethods: [
        { method: 'cash', value: 50, status: true },
        {
          method: 'card',
          value: 25,
          reference: 'card-ref',
          bankAccountId: 'bank_1',
          status: true,
        },
        { method: 'creditNote', value: 10, status: true },
      ],
      accountEntries: [{ arId: 'ar_1', invoiceId: 'inv_1', accountType: 'normal' }],
    });

    expect(result).toEqual([
      {
        id: 'arp_pay_1_cash_1',
        businessId: 'biz_1',
        direction: 'in',
        sourceType: 'receivable_payment',
        sourceId: 'pay_1',
        sourceDocumentId: 'inv_1',
        sourceDocumentType: 'invoice',
        cashCountId: 'cash_1',
        method: 'cash',
        amount: 50,
        counterpartyType: 'client',
        counterpartyId: 'client_1',
        reference: null,
        occurredAt: createdAt,
        createdAt,
        createdBy: 'user_1',
        impactsCashDrawer: true,
        impactsBankLedger: false,
        status: 'posted',
        metadata: {
          arId: 'ar_1',
          originType: null,
          originId: null,
          paymentScope: 'account',
          paymentOption: 'partial',
          accountIds: ['ar_1'],
          invoiceIds: ['inv_1'],
          paymentMethodIndex: 0,
          paymentMethodCount: 3,
        },
      },
      {
        id: 'arp_pay_1_card_2',
        businessId: 'biz_1',
        direction: 'in',
        sourceType: 'receivable_payment',
        sourceId: 'pay_1',
        sourceDocumentId: 'inv_1',
        sourceDocumentType: 'invoice',
        cashCountId: 'cash_1',
        bankAccountId: 'bank_1',
        method: 'card',
        amount: 25,
        counterpartyType: 'client',
        counterpartyId: 'client_1',
        reference: 'card-ref',
        occurredAt: createdAt,
        createdAt,
        createdBy: 'user_1',
        impactsCashDrawer: false,
        impactsBankLedger: true,
        status: 'posted',
        metadata: {
          arId: 'ar_1',
          originType: null,
          originId: null,
          paymentScope: 'account',
          paymentOption: 'partial',
          accountIds: ['ar_1'],
          invoiceIds: ['inv_1'],
          paymentMethodIndex: 1,
          paymentMethodCount: 3,
        },
      },
    ]);
  });

  it('marks insurance payments when the linked AR belongs to insurance', () => {
    const result = buildReceivablePaymentCashMovements({
      businessId: 'biz_1',
      createdAt: new Date('2026-03-17T10:00:00.000Z'),
      payment: { id: 'pay_2' },
      paymentMethods: [{ method: 'transfer', value: 80, status: true }],
      accountEntries: [{ arId: 'ar_ins', accountType: 'insurance' }],
    });

    expect(result[0]?.counterpartyType).toBe('insurance');
  });

  it('builds invoice POS movements with net cash after change', () => {
    const createdAt = new Date('2026-03-18T02:00:00.000Z');

    const result = buildInvoicePosCashMovements({
      businessId: 'biz_1',
      invoiceId: 'inv_1',
      cashCountId: 'cash_1',
      createdAt,
      createdBy: 'user_1',
      invoice: {
        id: 'inv_1',
        userID: 'user_1',
        client: { id: 'client_1' },
        numberID: 101,
        NCF: 'B0100000001',
        paymentMethod: [
          { method: 'cash', value: 100, status: true },
          {
            method: 'card',
            value: 25,
            status: true,
            reference: 'AUTH-1',
            bankAccountId: 'bank_card_1',
          },
        ],
        change: { value: 20 },
      },
    });

    expect(result).toEqual([
      {
        id: 'inv_inv_1_cash_1',
        businessId: 'biz_1',
        direction: 'in',
        sourceType: 'invoice_pos',
        sourceId: 'inv_1',
        sourceDocumentId: 'inv_1',
        sourceDocumentType: 'invoice',
        cashCountId: 'cash_1',
        method: 'cash',
        amount: 80,
        counterpartyType: 'client',
        counterpartyId: 'client_1',
        reference: null,
        occurredAt: createdAt,
        createdAt,
        createdBy: 'user_1',
        impactsCashDrawer: true,
        impactsBankLedger: false,
        status: 'posted',
        metadata: {
          invoiceNumber: '101',
          ncf: 'B0100000001',
          paymentMethodIndex: 0,
          paymentMethodCount: 2,
          fallbackPaymentSnapshotUsed: false,
          initialAmount: 100,
          changeApplied: 20,
          unappliedChange: 0,
        },
      },
      {
        id: 'inv_inv_1_card_2',
        businessId: 'biz_1',
        direction: 'in',
        sourceType: 'invoice_pos',
        sourceId: 'inv_1',
        sourceDocumentId: 'inv_1',
        sourceDocumentType: 'invoice',
        cashCountId: 'cash_1',
        bankAccountId: 'bank_card_1',
        method: 'card',
        amount: 25,
        counterpartyType: 'client',
        counterpartyId: 'client_1',
        reference: 'AUTH-1',
        occurredAt: createdAt,
        createdAt,
        createdBy: 'user_1',
        impactsCashDrawer: false,
        impactsBankLedger: true,
        status: 'posted',
        metadata: {
          invoiceNumber: '101',
          ncf: 'B0100000001',
          paymentMethodIndex: 1,
          paymentMethodCount: 2,
          fallbackPaymentSnapshotUsed: false,
          initialAmount: 25,
          changeApplied: 0,
          unappliedChange: 0,
        },
      },
    ]);
  });

  it('builds a canonical expense movement and marks deleted expenses as void', () => {
    const createdAt = new Date('2026-03-18T03:00:00.000Z');

    expect(
      buildExpenseCashMovement({
        businessId: 'biz_1',
        expenseId: 'exp_1',
        createdAt,
        createdBy: 'user_1',
        expense: {
          id: 'exp_1',
          amount: 45,
          status: 'deleted',
          description: 'Taxi',
          category: 'transporte',
          payment: {
            method: 'open_cash',
            cashRegister: 'cash_1',
            comment: 'Urgente',
          },
          dates: {
            expenseDate: createdAt,
            createdAt,
          },
        },
      }),
    ).toEqual({
      id: 'exp_exp_1',
      businessId: 'biz_1',
      direction: 'out',
      sourceType: 'expense',
      sourceId: 'exp_1',
      sourceDocumentId: 'exp_1',
      sourceDocumentType: 'expense',
      cashCountId: 'cash_1',
      method: 'cash',
      amount: 45,
      counterpartyType: null,
      counterpartyId: null,
      reference: null,
      occurredAt: createdAt,
      createdAt,
      createdBy: 'user_1',
      impactsCashDrawer: true,
      impactsBankLedger: false,
      status: 'void',
      metadata: {
        categoryId: null,
        category: 'transporte',
        description: 'Taxi',
        paymentComment: 'Urgente',
        bank: null,
        attachmentCount: 0,
      },
    });
  });

  it('preserves bankAccountId for bank-backed expense movements', () => {
    const createdAt = new Date('2026-03-18T03:30:00.000Z');

    expect(
      buildExpenseCashMovement({
        businessId: 'biz_1',
        expenseId: 'exp_bank_1',
        createdAt,
        createdBy: 'user_1',
        expense: {
          id: 'exp_bank_1',
          amount: 120,
          description: 'Proveedor internet',
          payment: {
            method: 'bank_transfer',
            bankAccountId: 'bank_1',
            bank: 'Banco Demo',
            reference: 'TRX-900',
          },
          dates: {
            expenseDate: createdAt,
            createdAt,
          },
        },
      }),
    ).toEqual({
      id: 'exp_exp_bank_1',
      businessId: 'biz_1',
      direction: 'out',
      sourceType: 'expense',
      sourceId: 'exp_bank_1',
      sourceDocumentId: 'exp_bank_1',
      sourceDocumentType: 'expense',
      bankAccountId: 'bank_1',
      cashCountId: null,
      method: 'transfer',
      amount: 120,
      counterpartyType: null,
      counterpartyId: null,
      reference: 'TRX-900',
      occurredAt: createdAt,
      createdAt,
      createdBy: 'user_1',
      impactsCashDrawer: false,
      impactsBankLedger: true,
      status: 'posted',
      metadata: {
        categoryId: null,
        category: null,
        description: 'Proveedor internet',
        paymentComment: null,
        bank: 'Banco Demo',
        attachmentCount: 0,
      },
    });
  });

  it('skips payable expenses until they are settled through treasury', () => {
    const createdAt = new Date('2026-03-18T03:45:00.000Z');

    expect(
      buildExpenseCashMovement({
        businessId: 'biz_1',
        expenseId: 'exp_ap_1',
        createdAt,
        createdBy: 'user_1',
        expense: {
          id: 'exp_ap_1',
          amount: 210,
          description: 'Internet de oficina',
          payment: {
            settlementMode: 'payable',
            method: 'bank_transfer',
            bankAccountId: 'bank_1',
          },
          dates: {
            expenseDate: createdAt,
            createdAt,
          },
        },
      }),
    ).toBeNull();
  });

  it('builds reversal movements for receivable payment voids without mutating original ledger entries', () => {
    const createdAt = new Date('2026-03-19T08:00:00.000Z');

    expect(
      buildReceivablePaymentVoidCashMovements({
        businessId: 'biz_1',
        cashCountId: 'cash_reversal_1',
        clientId: 'client_1',
        createdAt,
        createdBy: 'auditor_1',
        voidReason: 'Cobro registrado por error',
        payment: {
          id: 'pay_1',
          arId: 'ar_1',
          paymentScope: 'account',
          paymentOption: 'partial',
          cashCountId: 'cash_original_1',
        },
        paymentMethods: [
          { method: 'cash', value: 50, status: true },
          {
            method: 'card',
            value: 25,
            reference: 'card-ref',
            bankAccountId: 'bank_1',
            status: true,
          },
        ],
        accountEntries: [{ arId: 'ar_1', invoiceId: 'inv_1', accountType: 'normal' }],
      }),
    ).toEqual([
      expect.objectContaining({
        id: 'arpv_pay_1_cash_1',
        direction: 'out',
        sourceType: 'receivable_payment_void',
        cashCountId: 'cash_reversal_1',
        method: 'cash',
        amount: 50,
        metadata: expect.objectContaining({
          reversalOfSourceType: 'receivable_payment',
          originalCashCountId: 'cash_original_1',
        }),
      }),
      expect.objectContaining({
        id: 'arpv_pay_1_card_2',
        direction: 'out',
        sourceType: 'receivable_payment_void',
        bankAccountId: 'bank_1',
        method: 'card',
        amount: 25,
      }),
    ]);
  });

  it('builds supplier payment movements as cash outflows', () => {
    const createdAt = new Date('2026-03-18T09:00:00.000Z');

    expect(
      buildAccountsPayablePaymentCashMovements({
        businessId: 'biz_1',
        createdAt,
        payment: {
          id: 'pay_sup_1',
          purchaseId: 'purchase_1',
          supplierId: 'supplier_1',
          cashCountId: 'cash_1',
          receiptNumber: 'CPP-1001',
          paymentMethods: [
            { method: 'cash', value: 75, reference: 'REC-1', status: true },
          ],
          occurredAt: createdAt,
          createdAt,
          createdBy: 'user_1',
          nextPaymentAt: new Date('2026-03-25T09:00:00.000Z'),
        },
      }),
    ).toEqual([
      {
        id: 'app_pay_sup_1_cash_1',
        businessId: 'biz_1',
        direction: 'out',
        sourceType: 'supplier_payment',
        sourceId: 'pay_sup_1',
        sourceDocumentId: 'purchase_1',
        sourceDocumentType: 'purchase',
        cashCountId: 'cash_1',
        method: 'cash',
        amount: 75,
        counterpartyType: 'supplier',
        counterpartyId: 'supplier_1',
        reference: 'REC-1',
        occurredAt: createdAt,
        createdAt,
        createdBy: 'user_1',
        impactsCashDrawer: true,
        impactsBankLedger: false,
        status: 'posted',
        metadata: {
          purchaseId: 'purchase_1',
          supplierId: 'supplier_1',
          receiptNumber: 'CPP-1001',
          nextPaymentAt: new Date('2026-03-25T09:00:00.000Z'),
          paymentMethodIndex: 0,
          paymentMethodCount: 1,
        },
      },
    ]);
  });

  it('preserves bankAccountId for supplier bank payments', () => {
    const createdAt = new Date('2026-03-18T09:30:00.000Z');

    expect(
      buildAccountsPayablePaymentCashMovements({
        businessId: 'biz_1',
        createdAt,
        payment: {
          id: 'pay_sup_2',
          purchaseId: 'purchase_2',
          supplierId: 'supplier_2',
          bankAccountId: 'bank_sup_1',
          paymentMethods: [
            {
              method: 'transfer',
              value: 150,
              reference: 'TRX-22',
              status: true,
            },
          ],
          occurredAt: createdAt,
          createdAt,
        },
      }),
    ).toEqual([
      expect.objectContaining({
        id: 'app_pay_sup_2_transfer_1',
        bankAccountId: 'bank_sup_1',
        method: 'transfer',
        amount: 150,
      }),
    ]);
  });

  it('keeps per-method cash and bank sources isolated for mixed supplier payments', () => {
    const createdAt = new Date('2026-03-18T10:00:00.000Z');

    expect(
      buildAccountsPayablePaymentCashMovements({
        businessId: 'biz_1',
        createdAt,
        payment: {
          id: 'pay_sup_3',
          purchaseId: 'purchase_3',
          supplierId: 'supplier_3',
          paymentMethods: [
            {
              method: 'cash',
              value: 60,
              reference: 'REC-3',
              cashCountId: 'cash_3',
              status: true,
            },
            {
              method: 'transfer',
              value: 40,
              reference: 'TRX-3',
              bankAccountId: 'bank_sup_3',
              status: true,
            },
          ],
          occurredAt: createdAt,
          createdAt,
        },
      }),
    ).toEqual([
      expect.objectContaining({
        id: 'app_pay_sup_3_cash_1',
        cashCountId: 'cash_3',
        method: 'cash',
        amount: 60,
      }),
      expect.objectContaining({
        id: 'app_pay_sup_3_transfer_2',
        bankAccountId: 'bank_sup_3',
        method: 'transfer',
        amount: 40,
      }),
    ]);
  });

  it('builds paired treasury movements for internal transfers between cash and bank', () => {
    const createdAt = new Date('2026-03-19T11:00:00.000Z');

    expect(
      buildInternalTransferCashMovements({
        businessId: 'biz_1',
        createdAt,
        createdBy: 'user_1',
        transfer: {
          id: 'trf_1',
          amount: 300,
          reference: 'DEP-100',
          note: 'Deposito del turno',
          from: {
            type: 'cash',
            cashCountId: 'cash_1',
          },
          to: {
            type: 'bank',
            bankAccountId: 'bank_1',
          },
          occurredAt: createdAt,
          createdAt,
        },
      }),
    ).toEqual([
      {
        id: 'itf_trf_1_out',
        businessId: 'biz_1',
        direction: 'out',
        sourceType: 'internal_transfer',
        sourceId: 'trf_1',
        sourceDocumentId: 'trf_1',
        sourceDocumentType: 'internal_transfer',
        cashCountId: 'cash_1',
        method: 'cash',
        amount: 300,
        counterpartyType: null,
        counterpartyId: null,
        reference: 'DEP-100',
        occurredAt: createdAt,
        createdAt,
        createdBy: 'user_1',
        impactsCashDrawer: true,
        impactsBankLedger: false,
        status: 'posted',
        metadata: {
          transferType: 'cash_to_bank',
          note: 'Deposito del turno',
          transferSide: 'from',
          fromLedgerType: 'cash',
          toLedgerType: 'bank',
        },
      },
      {
        id: 'itf_trf_1_in',
        businessId: 'biz_1',
        direction: 'in',
        sourceType: 'internal_transfer',
        sourceId: 'trf_1',
        sourceDocumentId: 'trf_1',
        sourceDocumentType: 'internal_transfer',
        cashCountId: null,
        bankAccountId: 'bank_1',
        method: 'transfer',
        amount: 300,
        counterpartyType: null,
        counterpartyId: null,
        reference: 'DEP-100',
        occurredAt: createdAt,
        createdAt,
        createdBy: 'user_1',
        impactsCashDrawer: false,
        impactsBankLedger: true,
        status: 'posted',
        metadata: {
          transferType: 'cash_to_bank',
          note: 'Deposito del turno',
          transferSide: 'to',
          fromLedgerType: 'cash',
          toLedgerType: 'bank',
        },
      },
    ]);
  });
});
