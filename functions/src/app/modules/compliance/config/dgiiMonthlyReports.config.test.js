import { describe, expect, it } from 'vitest';

import {
  DGII_MONTHLY_REPORTS,
  getDgiiMonthlyReportDefinition,
  listDgiiMonthlyReportDefinitions,
} from './dgiiMonthlyReports.config.js';

describe('dgiiMonthlyReports.config', () => {
  it('expone las tres definiciones mensuales base de DGII', () => {
    expect(Object.keys(DGII_MONTHLY_REPORTS)).toEqual([
      'DGII_606',
      'DGII_607',
      'DGII_608',
    ]);
    expect(listDgiiMonthlyReportDefinitions()).toHaveLength(3);
  });

  it('define compras, gastos y pagos como fuente de verdad para 606', () => {
    const definition = getDgiiMonthlyReportDefinition('DGII_606');

    expect(definition?.sourceOfTruth.map((source) => source.sourceId)).toEqual([
      'purchases',
      'expenses',
      'accountsPayablePayments',
    ]);
    expect(definition?.pendingGaps).toEqual([]);
  });

  it('declara fuentes canónicas nuevas para 607 y 608 sin gaps pendientes', () => {
    expect(
      getDgiiMonthlyReportDefinition('DGII_607')?.sourceOfTruth.map(
        (source) => source.sourceId,
      ),
    ).toEqual(['invoices', 'creditNotes', 'thirdPartyWithholdings']);
    expect(
      getDgiiMonthlyReportDefinition('DGII_608')?.sourceOfTruth.find(
        (source) => source.sourceId === 'invoices',
      )?.requiredFields,
    ).toContain('voidReasonCode');
    expect(getDgiiMonthlyReportDefinition('DGII_607')?.pendingGaps).toEqual([]);
    expect(getDgiiMonthlyReportDefinition('DGII_608')?.pendingGaps).toEqual([]);
  });

  it('retorna null para reportes no definidos', () => {
    expect(getDgiiMonthlyReportDefinition('DGII_IR2')).toBeNull();
  });
});
