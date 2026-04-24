import { describe, expect, it } from 'vitest';

import {
  normalizeBankStatementLineRecord,
  normalizeCashMovementAsLiquidityLedgerEntry,
} from './records';

describe('normalizeCashMovementAsLiquidityLedgerEntry', () => {
  it('maps bank cash movements into treasury ledger entries without losing origin', () => {
    const entry = normalizeCashMovementAsLiquidityLedgerEntry(
      'app_1',
      'business-1',
      {
        amount: 1250,
        bankAccountId: 'bank-1',
        businessId: 'business-1',
        counterpartyId: 'supplier-1',
        counterpartyType: 'supplier',
        createdAt: 1_713_000_000_000,
        createdBy: 'user-1',
        direction: 'out',
        impactsBankLedger: true,
        method: 'transfer',
        occurredAt: 1_713_000_000_000,
        reference: 'TRX-1',
        sourceDocumentId: 'vendor-bill-1',
        sourceDocumentType: 'vendorBill',
        sourceId: 'payment-1',
        sourceType: 'supplier_payment',
        status: 'posted',
      },
    );

    expect(entry).toMatchObject({
      id: 'app_1',
      accountId: 'bank-1',
      accountType: 'bank',
      amount: 1250,
      direction: 'out',
      sourceId: 'payment-1',
      sourceType: 'supplier_payment',
      description: 'Pago a suplidor',
      reference: 'TRX-1',
      status: 'posted',
    });
    expect(entry?.metadata).toMatchObject({
      bankAccountId: 'bank-1',
      counterpartyId: 'supplier-1',
      counterpartyType: 'supplier',
      method: 'transfer',
      sourceDocumentId: 'vendor-bill-1',
      sourceDocumentType: 'vendorBill',
    });
  });

  it('uses cash drawer identity when movement has no bank account', () => {
    const entry = normalizeCashMovementAsLiquidityLedgerEntry(
      'arp_1',
      'business-1',
      {
        amount: 800,
        businessId: 'business-1',
        cashCountId: 'cash-count-1',
        direction: 'in',
        impactsCashDrawer: true,
        method: 'cash',
        occurredAt: 1_713_000_000_000,
        sourceId: 'payment-1',
        sourceType: 'receivable_payment',
        status: 'posted',
      },
    );

    expect(entry).toMatchObject({
      accountId: 'cash-count-1',
      accountType: 'cash',
      sourceType: 'receivable_payment',
      description: 'Cobro CxC',
    });
  });

  it('drops cash movements without treasury account identity', () => {
    expect(
      normalizeCashMovementAsLiquidityLedgerEntry('broken', 'business-1', {
        amount: 10,
        direction: 'in',
        sourceId: 'payment-1',
        sourceType: 'receivable_payment',
      }),
    ).toBeNull();
  });

  it('keeps explicit bank statement adjustment movements visible in treasury', () => {
    const entry = normalizeCashMovementAsLiquidityLedgerEntry(
      'bsladj_line-1',
      'business-1',
      {
        amount: 10,
        bankAccountId: 'bank-1',
        direction: 'out',
        impactsBankLedger: true,
        metadata: {
          description: 'Ajuste por comision bancaria',
        },
        method: 'transfer',
        occurredAt: 1_713_000_000_000,
        sourceId: 'statement-line-1',
        sourceType: 'bank_statement_adjustment',
        status: 'posted',
      },
    );

    expect(entry).toMatchObject({
      accountId: 'bank-1',
      description: 'Ajuste por comision bancaria',
      sourceType: 'bank_statement_adjustment',
    });
  });
});

describe('normalizeBankStatementLineRecord', () => {
  it('preserves written off status for resolved bank differences', () => {
    const statementLine = normalizeBankStatementLineRecord(
      'statement-line-1',
      'business-1',
      {
        amount: 100,
        bankAccountId: 'bank-1',
        lineType: 'transaction',
        status: 'written_off',
      },
    );

    expect(statementLine.status).toBe('written_off');
  });
});
