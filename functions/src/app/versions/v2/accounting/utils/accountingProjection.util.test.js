import { describe, expect, it } from 'vitest';

import { buildProjectedJournalLines } from './accountingProjection.util.js';

const chartOfAccounts = [
  {
    id: 'inventory-1',
    code: '1130',
    name: 'Inventario',
    status: 'active',
    postingAllowed: true,
    systemKey: 'inventory',
  },
  {
    id: 'tax-receivable-1',
    code: '1125',
    name: 'Impuestos por recuperar',
    status: 'active',
    postingAllowed: true,
    systemKey: 'tax_receivable',
  },
  {
    id: 'accounts-payable-1',
    code: '2100',
    name: 'Cuentas por pagar',
    status: 'active',
    postingAllowed: true,
    systemKey: 'accounts_payable',
  },
  {
    id: 'operating-expenses-1',
    code: '5100',
    name: 'Gastos operativos',
    status: 'active',
    postingAllowed: true,
    systemKey: 'operating_expenses',
  },
  {
    id: 'bank-1',
    code: '1110',
    name: 'Banco',
    status: 'active',
    postingAllowed: true,
    systemKey: 'bank',
  },
  {
    id: 'cash-1',
    code: '1100',
    name: 'Caja general',
    status: 'active',
    postingAllowed: true,
    systemKey: 'cash',
  },
  {
    id: 'bank-source-ledger',
    code: '1110.01',
    name: 'Banco origen',
    status: 'active',
    postingAllowed: true,
  },
  {
    id: 'bank-destination-ledger',
    code: '1110.02',
    name: 'Banco destino',
    status: 'active',
    postingAllowed: true,
  },
  {
    id: 'cash-source-ledger',
    code: '1100.01',
    name: 'Caja origen',
    status: 'active',
    postingAllowed: true,
  },
  {
    id: 'cash-destination-ledger',
    code: '1100.02',
    name: 'Caja destino',
    status: 'active',
    postingAllowed: true,
  },
  {
    id: 'tax-payable-1',
    code: '2200',
    name: 'Impuestos por pagar',
    status: 'active',
    postingAllowed: true,
    systemKey: 'tax_payable',
  },
  {
    id: 'withholding-itbis-payable-1',
    code: '2210',
    name: 'Retenciones ITBIS por pagar',
    status: 'active',
    postingAllowed: true,
    systemKey: 'withholding_itbis_payable',
  },
  {
    id: 'withholding-isr-payable-1',
    code: '2220',
    name: 'Retenciones ISR por pagar',
    status: 'active',
    postingAllowed: true,
    systemKey: 'withholding_isr_payable',
  },
];

describe('accountingProjection.util fiscal amount sources', () => {
  it('marks profile lines targeting parent accounts as unresolved', () => {
    const { lines, unresolvedLines } = buildProjectedJournalLines({
      event: {
        id: 'invoice.committed__invoice-1',
        eventType: 'invoice.committed',
        sourceDocumentId: 'invoice-1',
        monetary: {
          amount: 100,
          functionalAmount: 100,
        },
      },
      profile: {
        id: 'invoice-profile',
        name: 'Venta',
        eventType: 'invoice.committed',
        linesTemplate: [
          {
            id: 'cash',
            side: 'debit',
            accountId: 'cash-1',
            amountSource: 'document_total',
            omitIfZero: true,
          },
        ],
      },
      chartOfAccounts: [
        ...chartOfAccounts,
        {
          id: 'cash-child-1',
          code: '1101',
          name: 'Caja principal',
          status: 'active',
          postingAllowed: true,
          parentId: 'cash-1',
        },
      ],
    });

    expect(lines).toHaveLength(0);
    expect(unresolvedLines).toEqual([
      expect.objectContaining({
        accountId: 'cash-1',
        reason: 'account_has_children',
      }),
    ]);
  });

  it('projects a credit inventory purchase with recoverable ITBIS separated from inventory', () => {
    const { lines, unresolvedLines } = buildProjectedJournalLines({
      event: {
        id: 'purchase.committed__purchase-1',
        eventType: 'purchase.committed',
        sourceDocumentId: 'purchase-1',
        monetary: {
          amount: 1180,
          subtotalAmount: 1000,
          taxAmount: 180,
          netPayableAmount: 1180,
          functionalAmount: 1180,
          functionalSubtotalAmount: 1000,
          functionalTaxAmount: 180,
          functionalNetPayableAmount: 1180,
        },
      },
      profile: {
        id: 'purchase-profile',
        name: 'Compra inventariable',
        eventType: 'purchase.committed',
        linesTemplate: [
          {
            id: 'inventory',
            side: 'debit',
            accountSystemKey: 'inventory',
            amountSource: 'purchase_subtotal',
            omitIfZero: true,
          },
          {
            id: 'tax',
            side: 'debit',
            accountSystemKey: 'tax_receivable',
            amountSource: 'purchase_tax',
            omitIfZero: true,
          },
          {
            id: 'payable',
            side: 'credit',
            accountSystemKey: 'accounts_payable',
            amountSource: 'purchase_total',
            omitIfZero: true,
          },
        ],
      },
      bankAccounts: [],
      chartOfAccounts,
    });

    expect(unresolvedLines).toEqual([]);
    expect(lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'inventory',
        debit: 1000,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'tax_receivable',
        debit: 180,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'accounts_payable',
        debit: 0,
        credit: 1180,
      }),
    ]);
  });

  it('projects a bank expense with ITBIS and supplier withholdings as separate liabilities', () => {
    const { lines, unresolvedLines } = buildProjectedJournalLines({
      event: {
        id: 'expense.recorded__expense-1',
        eventType: 'expense.recorded',
        sourceDocumentId: 'expense-1',
        monetary: {
          amount: 1180,
          subtotalAmount: 1000,
          taxAmount: 180,
          withholdingITBISAmount: 54,
          withholdingISRAmount: 100,
          netPayableAmount: 1026,
          functionalAmount: 1180,
          functionalSubtotalAmount: 1000,
          functionalTaxAmount: 180,
          functionalWithholdingITBISAmount: 54,
          functionalWithholdingISRAmount: 100,
          functionalNetPayableAmount: 1026,
        },
      },
      profile: {
        id: 'expense-profile',
        name: 'Gasto por banco',
        eventType: 'expense.recorded',
        linesTemplate: [
          {
            id: 'expense',
            side: 'debit',
            accountSystemKey: 'operating_expenses',
            amountSource: 'expense_subtotal',
            omitIfZero: true,
          },
          {
            id: 'tax',
            side: 'debit',
            accountSystemKey: 'tax_receivable',
            amountSource: 'expense_tax',
            omitIfZero: true,
          },
          {
            id: 'bank',
            side: 'credit',
            accountSystemKey: 'bank',
            amountSource: 'expense_net_payable',
            omitIfZero: true,
          },
          {
            id: 'itbis-withholding',
            side: 'credit',
            accountSystemKey: 'withholding_itbis_payable',
            amountSource: 'expense_withholding_itbis',
            omitIfZero: true,
          },
          {
            id: 'isr-withholding',
            side: 'credit',
            accountSystemKey: 'withholding_isr_payable',
            amountSource: 'expense_withholding_isr',
            omitIfZero: true,
          },
        ],
      },
      bankAccounts: [],
      chartOfAccounts,
    });

    expect(unresolvedLines).toEqual([]);
    expect(lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'operating_expenses',
        debit: 1000,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'tax_receivable',
        debit: 180,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'bank',
        debit: 0,
        credit: 1026,
      }),
      expect.objectContaining({
        accountSystemKey: 'withholding_itbis_payable',
        debit: 0,
        credit: 54,
      }),
      expect.objectContaining({
        accountSystemKey: 'withholding_isr_payable',
        debit: 0,
        credit: 100,
      }),
    ]);
  });

  it('projects payable payments with fiscal withholding as non-cash AP settlement', () => {
    const { lines, unresolvedLines } = buildProjectedJournalLines({
      event: {
        id: 'accounts_payable.payment.recorded__payment-1',
        eventType: 'accounts_payable.payment.recorded',
        sourceDocumentId: 'payment-1',
        monetary: {
          amount: 1106,
          functionalAmount: 1106,
        },
        treasury: {
          paymentChannel: 'bank',
        },
        payload: {
          paymentMethods: [
            {
              method: 'transfer',
              amount: 1106,
            },
          ],
          withholdingApplications: [
            {
              type: 'itbis',
              amount: 54,
            },
            {
              type: 'isr',
              amount: 20,
            },
          ],
        },
      },
      profile: {
        id: 'ap-payment-profile',
        name: 'Pago CxP con retenciones',
        eventType: 'accounts_payable.payment.recorded',
        linesTemplate: [
          {
            id: 'ap',
            side: 'debit',
            accountSystemKey: 'accounts_payable',
            amountSource: 'accounts_payable_payment_amount',
            omitIfZero: true,
          },
          {
            id: 'bank',
            side: 'credit',
            accountSystemKey: 'bank',
            amountSource: 'accounts_payable_bank_paid',
            omitIfZero: true,
          },
          {
            id: 'itbis-withholding',
            side: 'credit',
            accountSystemKey: 'withholding_itbis_payable',
            amountSource: 'accounts_payable_withholding_itbis',
            omitIfZero: true,
          },
          {
            id: 'isr-withholding',
            side: 'credit',
            accountSystemKey: 'withholding_isr_payable',
            amountSource: 'accounts_payable_withholding_isr',
            omitIfZero: true,
          },
        ],
      },
      bankAccounts: [],
      chartOfAccounts,
    });

    expect(unresolvedLines).toEqual([]);
    expect(lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'accounts_payable',
        debit: 1180,
        credit: 0,
        amountSource: 'accounts_payable_payment_amount',
      }),
      expect.objectContaining({
        accountSystemKey: 'bank',
        debit: 0,
        credit: 1106,
        amountSource: 'accounts_payable_bank_paid',
      }),
      expect.objectContaining({
        accountSystemKey: 'withholding_itbis_payable',
        debit: 0,
        credit: 54,
        amountSource: 'accounts_payable_withholding_itbis',
      }),
      expect.objectContaining({
        accountSystemKey: 'withholding_isr_payable',
        debit: 0,
        credit: 20,
        amountSource: 'accounts_payable_withholding_isr',
      }),
    ]);
  });
});

describe('accountingProjection.util internal transfer dynamic ledgers', () => {
  const transferProfile = {
    id: 'internal-transfer-profile',
    name: 'Transferencia banco a banco',
    eventType: 'internal_transfer.posted',
    linesTemplate: [
      {
        id: 'destination',
        side: 'debit',
        accountSystemKey: 'bank',
        amountSource: 'transfer_amount',
        omitIfZero: true,
        metadata: { treasuryRole: 'destination' },
      },
      {
        id: 'source',
        side: 'credit',
        accountSystemKey: 'bank',
        amountSource: 'transfer_amount',
        omitIfZero: true,
        metadata: { treasuryRole: 'source' },
      },
    ],
  };

  it('projects bank to bank transfers against source and destination bank ledgers', () => {
    const { lines, unresolvedLines } = buildProjectedJournalLines({
      event: {
        id: 'internal_transfer.posted__transfer-1',
        eventType: 'internal_transfer.posted',
        sourceDocumentId: 'transfer-1',
        monetary: { amount: 250, functionalAmount: 250 },
        treasury: { paymentChannel: 'bank' },
        payload: {
          transferDirection: 'bank_to_bank',
          from: { type: 'bank', bankAccountId: 'bank-source' },
          to: { type: 'bank', bankAccountId: 'bank-destination' },
        },
      },
      profile: transferProfile,
      bankAccounts: [
        {
          id: 'bank-source',
          status: 'active',
          chartOfAccountId: 'bank-source-ledger',
        },
        {
          id: 'bank-destination',
          status: 'active',
          chartOfAccountId: 'bank-destination-ledger',
        },
      ],
      cashAccounts: [],
      chartOfAccounts,
    });

    expect(unresolvedLines).toEqual([]);
    expect(lines).toEqual([
      expect.objectContaining({
        accountId: 'bank-destination-ledger',
        debit: 250,
        credit: 0,
        metadata: expect.objectContaining({ treasuryRole: 'destination' }),
      }),
      expect.objectContaining({
        accountId: 'bank-source-ledger',
        debit: 0,
        credit: 250,
        metadata: expect.objectContaining({ treasuryRole: 'source' }),
      }),
    ]);
  });

  it('keeps cash to cash pending when cash accounts do not have chart links', () => {
    const { lines, unresolvedLines } = buildProjectedJournalLines({
      event: {
        id: 'internal_transfer.posted__transfer-2',
        eventType: 'internal_transfer.posted',
        sourceDocumentId: 'transfer-2',
        monetary: { amount: 80, functionalAmount: 80 },
        treasury: { paymentChannel: 'cash' },
        payload: {
          transferDirection: 'cash_to_cash',
          from: { type: 'cash', cashAccountId: 'cash-source' },
          to: { type: 'cash', cashAccountId: 'cash-destination' },
        },
      },
      profile: {
        ...transferProfile,
        linesTemplate: transferProfile.linesTemplate.map((line) => ({
          ...line,
          accountSystemKey: 'cash',
        })),
      },
      bankAccounts: [],
      cashAccounts: [
        { id: 'cash-source', status: 'active' },
        { id: 'cash-destination', status: 'active' },
      ],
      chartOfAccounts,
    });

    expect(lines).toEqual([]);
    expect(unresolvedLines).toHaveLength(2);
    expect(unresolvedLines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ lineId: 'destination' }),
        expect.objectContaining({ lineId: 'source' }),
      ]),
    );
  });

  it('keeps cash to bank transfers pending when the source cash account has no chart link', () => {
    const { lines, unresolvedLines } = buildProjectedJournalLines({
      event: {
        id: 'internal_transfer.posted__transfer-cash-bank',
        eventType: 'internal_transfer.posted',
        sourceDocumentId: 'transfer-cash-bank',
        monetary: { amount: 120, functionalAmount: 120 },
        treasury: { paymentChannel: 'mixed' },
        payload: {
          transferDirection: 'cash_to_bank',
          from: { type: 'cash', cashAccountId: 'cash-source' },
          to: { type: 'bank', bankAccountId: 'bank-destination' },
        },
      },
      profile: {
        ...transferProfile,
        linesTemplate: [
          {
            ...transferProfile.linesTemplate[0],
            accountSystemKey: 'bank',
            metadata: { treasuryRole: 'destination' },
          },
          {
            ...transferProfile.linesTemplate[1],
            accountSystemKey: 'cash',
            metadata: { treasuryRole: 'source' },
          },
        ],
      },
      bankAccounts: [
        {
          id: 'bank-destination',
          status: 'active',
          chartOfAccountId: 'bank-destination-ledger',
        },
      ],
      cashAccounts: [{ id: 'cash-source', status: 'active' }],
      chartOfAccounts,
    });

    expect(lines).toEqual([
      expect.objectContaining({
        accountId: 'bank-destination-ledger',
        debit: 120,
        credit: 0,
      }),
    ]);
    expect(unresolvedLines).toEqual([
      expect.objectContaining({ lineId: 'source' }),
    ]);
  });

  it('keeps bank to cash transfers pending when the destination cash account has no chart link', () => {
    const { lines, unresolvedLines } = buildProjectedJournalLines({
      event: {
        id: 'internal_transfer.posted__transfer-bank-cash',
        eventType: 'internal_transfer.posted',
        sourceDocumentId: 'transfer-bank-cash',
        monetary: { amount: 150, functionalAmount: 150 },
        treasury: { paymentChannel: 'mixed' },
        payload: {
          transferDirection: 'bank_to_cash',
          from: { type: 'bank', bankAccountId: 'bank-source' },
          to: { type: 'cash', cashAccountId: 'cash-destination' },
        },
      },
      profile: {
        ...transferProfile,
        linesTemplate: [
          {
            ...transferProfile.linesTemplate[0],
            accountSystemKey: 'cash',
            metadata: { treasuryRole: 'destination' },
          },
          {
            ...transferProfile.linesTemplate[1],
            accountSystemKey: 'bank',
            metadata: { treasuryRole: 'source' },
          },
        ],
      },
      bankAccounts: [
        {
          id: 'bank-source',
          status: 'active',
          chartOfAccountId: 'bank-source-ledger',
        },
      ],
      cashAccounts: [{ id: 'cash-destination', status: 'active' }],
      chartOfAccounts,
    });

    expect(lines).toEqual([
      expect.objectContaining({
        accountId: 'bank-source-ledger',
        debit: 0,
        credit: 150,
      }),
    ]);
    expect(unresolvedLines).toEqual([
      expect.objectContaining({ lineId: 'destination' }),
    ]);
  });

  it('projects cash to cash transfers when cash accounts have chart links', () => {
    const { lines, unresolvedLines } = buildProjectedJournalLines({
      event: {
        id: 'internal_transfer.posted__transfer-3',
        eventType: 'internal_transfer.posted',
        sourceDocumentId: 'transfer-3',
        monetary: { amount: 80, functionalAmount: 80 },
        treasury: { paymentChannel: 'cash' },
        payload: {
          transferDirection: 'cash_to_cash',
          from: { type: 'cash', cashAccountId: 'cash-source' },
          to: { type: 'cash', cashAccountId: 'cash-destination' },
        },
      },
      profile: {
        ...transferProfile,
        linesTemplate: transferProfile.linesTemplate.map((line) => ({
          ...line,
          accountSystemKey: 'cash',
        })),
      },
      bankAccounts: [],
      cashAccounts: [
        {
          id: 'cash-source',
          status: 'active',
          chartOfAccountId: 'cash-source-ledger',
        },
        {
          id: 'cash-destination',
          status: 'active',
          chartOfAccountId: 'cash-destination-ledger',
        },
      ],
      chartOfAccounts,
    });

    expect(unresolvedLines).toEqual([]);
    expect(lines).toEqual([
      expect.objectContaining({
        accountId: 'cash-destination-ledger',
        debit: 80,
        credit: 0,
      }),
      expect.objectContaining({
        accountId: 'cash-source-ledger',
        debit: 0,
        credit: 80,
      }),
    ]);
  });
});
