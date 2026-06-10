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
    normalizeChartOfAccountRecord('tax-receivable-id', 'business-1', {
      code: '1125',
      name: 'Impuestos por recuperar',
      type: 'asset',
      systemKey: 'tax_receivable',
    }),
    normalizeChartOfAccountRecord('inventory-id', 'business-1', {
      code: '1130',
      name: 'Inventario',
      type: 'asset',
      systemKey: 'inventory',
    }),
    normalizeChartOfAccountRecord('supplier-credits-id', 'business-1', {
      code: '1140',
      name: 'Saldos a favor de suplidores',
      type: 'asset',
      systemKey: 'supplier_credits',
    }),
    normalizeChartOfAccountRecord('ap-id', 'business-1', {
      code: '2100',
      name: 'Cuentas por pagar',
      type: 'liability',
      systemKey: 'accounts_payable',
    }),
    normalizeChartOfAccountRecord('payroll-payable-id', 'business-1', {
      code: '2110',
      name: 'Nomina por pagar',
      type: 'liability',
      systemKey: 'payroll_payable',
    }),
    normalizeChartOfAccountRecord('payroll-withholdings-id', 'business-1', {
      code: '2120',
      name: 'Retenciones laborales por pagar',
      type: 'liability',
      systemKey: 'payroll_withholdings_payable',
    }),
    normalizeChartOfAccountRecord('customer-credits-id', 'business-1', {
      code: '2300',
      name: 'Créditos a clientes',
      type: 'liability',
      systemKey: 'customer_credits',
    }),
    normalizeChartOfAccountRecord('tax-id', 'business-1', {
      code: '2200',
      name: 'Impuestos por pagar',
      type: 'liability',
      systemKey: 'tax_payable',
    }),
    normalizeChartOfAccountRecord('withholding-itbis-id', 'business-1', {
      code: '2210',
      name: 'Retenciones ITBIS por pagar',
      type: 'liability',
      systemKey: 'withholding_itbis_payable',
    }),
    normalizeChartOfAccountRecord('withholding-isr-id', 'business-1', {
      code: '2220',
      name: 'Retenciones ISR por pagar',
      type: 'liability',
      systemKey: 'withholding_isr_payable',
    }),
    normalizeChartOfAccountRecord('cash-over-short-income-id', 'business-1', {
      code: '4150',
      name: 'Ingresos por sobrante de caja',
      type: 'income',
      systemKey: 'cash_over_short_income',
    }),
    normalizeChartOfAccountRecord(
      'bank-reconciliation-income-id',
      'business-1',
      {
        code: '4160',
        name: 'Ingresos por conciliación bancaria',
        type: 'income',
        systemKey: 'bank_reconciliation_income',
      },
    ),
    normalizeChartOfAccountRecord('sales-id', 'business-1', {
      code: '4100',
      name: 'Ventas',
      type: 'income',
      systemKey: 'sales',
    }),
    normalizeChartOfAccountRecord('fx-gain-id', 'business-1', {
      code: '4200',
      name: 'Ingresos por diferencia cambiaria',
      type: 'income',
      systemKey: 'fx_gain',
    }),
    normalizeChartOfAccountRecord('expense-id', 'business-1', {
      code: '5200',
      name: 'Gastos operativos',
      type: 'expense',
      systemKey: 'operating_expenses',
    }),
    normalizeChartOfAccountRecord('cost-of-sales-id', 'business-1', {
      code: '5100',
      name: 'Costo de venta',
      type: 'expense',
      systemKey: 'cost_of_sales',
    }),
    normalizeChartOfAccountRecord('cash-over-short-expense-id', 'business-1', {
      code: '5250',
      name: 'Pérdidas por faltante de caja',
      type: 'expense',
      systemKey: 'cash_over_short_expense',
    }),
    normalizeChartOfAccountRecord(
      'bank-reconciliation-expense-id',
      'business-1',
      {
        code: '5260',
        name: 'Gastos por conciliación bancaria',
        type: 'expense',
        systemKey: 'bank_reconciliation_expense',
      },
    ),
    normalizeChartOfAccountRecord('fx-loss-id', 'business-1', {
      code: '5300',
      name: 'Gastos por diferencia cambiaria',
      type: 'expense',
      systemKey: 'fx_loss',
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
    expect(
      normalizeAccountingPostingAmountSource(
        'accounts_receivable_applied_amount',
      ),
    ).toBe('accounts_receivable_applied_amount');
    expect(
      normalizeAccountingPostingAmountSource(
        'accounts_receivable_collected_amount',
      ),
    ).toBe('accounts_receivable_collected_amount');
    expect(
      normalizeAccountingPostingAmountSource(
        'accounts_receivable_withholding_amount',
      ),
    ).toBe('accounts_receivable_withholding_amount');
    expect(
      normalizeAccountingPostingAmountSource('accounts_payable_cash_paid'),
    ).toBe('accounts_payable_cash_paid');
    expect(
      normalizeAccountingPostingAmountSource('accounts_payable_bank_paid'),
    ).toBe('accounts_payable_bank_paid');
    expect(
      normalizeAccountingPostingAmountSource(
        'accounts_payable_credit_note_applied',
      ),
    ).toBe('accounts_payable_credit_note_applied');
    expect(
      normalizeAccountingPostingAmountSource('payroll_accrual_amount'),
    ).toBe('payroll_accrual_amount');
    expect(
      normalizeAccountingPostingAmountSource('payroll_net_payable_amount'),
    ).toBe('payroll_net_payable_amount');
    expect(
      normalizeAccountingPostingAmountSource('payroll_tax_deductions_amount'),
    ).toBe('payroll_tax_deductions_amount');
    expect(
      normalizeAccountingPostingAmountSource('payroll_other_deductions_amount'),
    ).toBe('payroll_other_deductions_amount');
    expect(
      normalizeAccountingPostingAmountSource('bank_statement_adjustment_loss'),
    ).toBe('bank_statement_adjustment_loss');
    expect(normalizeAccountingPostingAmountSource('fx_gain')).toBe('fx_gain');
    expect(normalizeAccountingPostingAmountSource('fx_loss')).toBe('fx_loss');
  });

  it('construye templates base cuando existen las cuentas canonicas', () => {
    const result =
      buildDefaultAccountingPostingProfileTemplates(chartOfAccounts);

    expect(result.some((profile) => profile.name === 'Venta al contado')).toBe(
      true,
    );
    expect(
      result.some((profile) => profile.name === 'Venta al contado por banco'),
    ).toBe(true);
    expect(
      result.some(
        (profile) =>
          profile.name === 'Costo de venta por salida de inventario' &&
          profile.eventType === 'inventory.cogs.recorded',
      ),
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
      result
        .find((profile) => profile.name === 'Cobro por banco')
        ?.linesTemplate.some(
          (line) =>
            line.accountSystemKey === 'tax_receivable' &&
            line.amountSource === 'accounts_receivable_withholding_amount',
        ),
    ).toBe(true);
    expect(
      result.some((profile) => profile.name === 'Pago a suplidor por banco'),
    ).toBe(true);
    expect(
      result.some(
        (profile) =>
          profile.name === 'Saldo a favor de suplidor emitido' &&
          profile.eventType === 'supplier_credit_note.issued',
      ),
    ).toBe(true);
    expect(
      result.some(
        (profile) =>
          profile.name === 'Pago mixto a suplidor' &&
          profile.eventType === 'accounts_payable.payment.recorded',
      ),
    ).toBe(true);
    expect(
      result.some(
        (profile) =>
          profile.name === 'Diferencia cambiaria liquidada' &&
          profile.eventType === 'fx_settlement.recorded',
      ),
    ).toBe(true);
    expect(
      result.some(
        (profile) =>
          profile.name === 'Anulacion de diferencia cambiaria' &&
          profile.eventType === 'fx_settlement.voided',
      ),
    ).toBe(true);
    expect(
      result.some(
        (profile) =>
          profile.name === 'Pago a suplidor con saldo a favor' &&
          profile.eventType === 'accounts_payable.payment.recorded',
      ),
    ).toBe(true);
    expect(
      result.some(
        (profile) =>
          profile.name === 'Compra inventariable al contado por banco' &&
          profile.eventType === 'purchase.committed',
      ),
    ).toBe(true);
    expect(
      result.some((profile) => profile.name === 'Pago a suplidor por caja'),
    ).toBe(true);
    expect(
      result.some((profile) => profile.name === 'Anulación de cobro en caja'),
    ).toBe(true);
    expect(
      result.some((profile) => profile.name === 'Anulación de cobro por banco'),
    ).toBe(true);
    expect(
      result.some(
        (profile) => profile.name === 'Nota de crédito emitida a cliente',
      ),
    ).toBe(true);
    expect(
      result.some(
        (profile) => profile.name === 'Nota de crédito aplicada a CxC',
      ),
    ).toBe(true);
    expect(
      result.some(
        (profile) => profile.name === 'Anulación de pago a suplidor por caja',
      ),
    ).toBe(true);
    expect(
      result.some(
        (profile) => profile.name === 'Anulación de pago a suplidor por banco',
      ),
    ).toBe(true);
    expect(result.some((profile) => profile.name === 'Gasto por banco')).toBe(
      true,
    );
    expect(
      result.some((profile) => profile.name === 'Nomina RRHH devengada'),
    ).toBe(true);
    expect(
      result
        .find((profile) => profile.name === 'Nomina RRHH devengada')
        ?.linesTemplate.some(
          (line) =>
            line.accountSystemKey === 'payroll_withholdings_payable' &&
            line.amountSource === 'payroll_other_deductions_amount',
        ),
    ).toBe(true);
    expect(
      result.some((profile) => profile.name === 'Pago de nomina por caja'),
    ).toBe(true);
    expect(
      result.some((profile) => profile.name === 'Pago de nomina por banco'),
    ).toBe(true);
    expect(
      result.some((profile) => profile.name === 'Diferencia de cuadre de caja'),
    ).toBe(true);
    expect(
      result.some(
        (profile) => profile.name === 'Ajuste por diferencia bancaria',
      ),
    ).toBe(true);
  });
});
