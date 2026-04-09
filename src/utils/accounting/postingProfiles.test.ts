import { describe, expect, it } from 'vitest';

import { normalizeChartOfAccountRecord } from '@/utils/accounting/chartOfAccounts';
import {
  buildDefaultAccountingPostingProfileTemplates,
  normalizeAccountingPostingAmountSource,
  normalizeAccountingPostingProfileDraft,
} from '@/utils/accounting/postingProfiles';

describe('postingProfiles', () => {
  const chartOfAccounts = [
    normalizeChartOfAccountRecord('cash-id', 'business-1', {
      code: '1100',
      name: 'Caja general',
      type: 'asset',
      systemKey: 'cash',
    }),
    normalizeChartOfAccountRecord('bank-id', 'business-1', {
      code: '1110',
      name: 'Banco',
      type: 'asset',
      systemKey: 'bank',
    }),
    normalizeChartOfAccountRecord('ar-id', 'business-1', {
      code: '1120',
      name: 'Cuentas por cobrar',
      type: 'asset',
      systemKey: 'accounts_receivable',
    }),
    normalizeChartOfAccountRecord('inventory-id', 'business-1', {
      code: '1130',
      name: 'Inventario',
      type: 'asset',
      systemKey: 'inventory',
    }),
    normalizeChartOfAccountRecord('ap-id', 'business-1', {
      code: '2100',
      name: 'Cuentas por pagar',
      type: 'liability',
      systemKey: 'accounts_payable',
    }),
    normalizeChartOfAccountRecord('tax-id', 'business-1', {
      code: '2200',
      name: 'Impuestos por pagar',
      type: 'liability',
      systemKey: 'tax_payable',
    }),
    normalizeChartOfAccountRecord('cash-over-short-income-id', 'business-1', {
      code: '4150',
      name: 'Ingresos por sobrante de caja',
      type: 'income',
      systemKey: 'cash_over_short_income',
    }),
    normalizeChartOfAccountRecord('sales-id', 'business-1', {
      code: '4100',
      name: 'Ventas',
      type: 'income',
      systemKey: 'sales',
    }),
    normalizeChartOfAccountRecord('expense-id', 'business-1', {
      code: '5200',
      name: 'Gastos operativos',
      type: 'expense',
      systemKey: 'operating_expenses',
    }),
    normalizeChartOfAccountRecord('cash-over-short-expense-id', 'business-1', {
      code: '5250',
      name: 'Pérdidas por faltante de caja',
      type: 'expense',
      systemKey: 'cash_over_short_expense',
    }),
  ];

  it('normaliza drafts con defaults minimos', () => {
    const result = normalizeAccountingPostingProfileDraft({});

    expect(result).toMatchObject({
      eventType: 'invoice.committed',
      moduleKey: 'sales',
      priority: 100,
      status: 'active',
    });
    expect(result.linesTemplate).toHaveLength(2);
  });

  it('acepta las fuentes de monto avanzadas para ventas mixtas y abonos', () => {
    expect(normalizeAccountingPostingAmountSource('sale_cash_received')).toBe(
      'sale_cash_received',
    );
    expect(
      normalizeAccountingPostingAmountSource('sale_receivable_balance'),
    ).toBe('sale_receivable_balance');
    expect(normalizeAccountingPostingAmountSource('sale_bank_received')).toBe(
      'sale_bank_received',
    );
    expect(normalizeAccountingPostingAmountSource('cash_over_short_gain')).toBe(
      'cash_over_short_gain',
    );
  });

  it('construye templates base cuando existen las cuentas canonicas', () => {
    const result = buildDefaultAccountingPostingProfileTemplates(chartOfAccounts);

    expect(result.some((profile) => profile.name === 'Venta al contado')).toBe(
      true,
    );
    expect(
      result.some((profile) => profile.name === 'Venta al contado por banco'),
    ).toBe(true);
    expect(
      result.some(
        (profile) => profile.name === 'Venta a credito con abono inicial',
      ),
    ).toBe(true);
    expect(result.some((profile) => profile.name === 'Cobro por banco')).toBe(
      true,
    );
    expect(
      result.some((profile) => profile.name === 'Pago a suplidor por banco'),
    ).toBe(true);
    expect(
      result.some((profile) => profile.name === 'Pago a suplidor por caja'),
    ).toBe(true);
    expect(result.some((profile) => profile.name === 'Gasto por banco')).toBe(
      true,
    );
    expect(
      result.some((profile) => profile.name === 'Diferencia de cuadre de caja'),
    ).toBe(true);
  });
});
