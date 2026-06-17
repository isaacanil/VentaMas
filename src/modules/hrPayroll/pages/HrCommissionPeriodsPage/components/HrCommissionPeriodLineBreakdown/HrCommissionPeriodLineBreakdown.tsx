import {
  formatHrDate,
  formatHrMoney as formatMoney,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrCommissionEntryRecord,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';
import {
  getHrCommissionLineDeductionAmount as getLineDeductionAmount,
  getHrCommissionLinePendingAmount as getLinePendingAmount,
} from '../../utils/hrCommissionPeriodAmounts';

import {
  BreakdownMetric,
  BreakdownMetricLabel,
  EmptyBreakdown,
  EntryTable,
  EntryTableScroll,
  LineBreakdownBody,
  LineBreakdownFormula,
  LineBreakdownItem,
  LineBreakdownNote,
  LineBreakdownStack,
  LineBreakdownSummary,
  TraceabilityWarning,
  TraceabilityWarningTitle,
  LineBreakdownTitle,
} from './HrCommissionPeriodLineBreakdown.styles';

interface HrCommissionPeriodLineBreakdownProps {
  entries: HrCommissionEntryRecord[];
  lines: HrPayrollEmployeeLineRecord[];
  loading?: boolean;
}

const toMoneyNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const getEmployeeLabel = (line: HrPayrollEmployeeLineRecord): string =>
  line.employeeNameSnapshot || line.employeeCode || line.employeeId;

const entryMatchesLine = (
  entry: HrCommissionEntryRecord,
  line: HrPayrollEmployeeLineRecord,
): boolean =>
  entry.payrollEmployeeLineId === line.id ||
  line.commissionEntryIds.includes(entry.id) ||
  (line.retroactiveEntryIds ?? []).includes(entry.id) ||
  (entry.periodId === line.periodId && entry.employeeId === line.employeeId);

const getEntrySourceReference = (entry: HrCommissionEntryRecord): string =>
  entry.sourceCommissionId ||
  entry.invoiceItemId ||
  entry.invoiceId ||
  entry.id;

const getEntryOriginalCut = (entry: HrCommissionEntryRecord): string =>
  entry.originalPeriodLabel ||
  entry.originalPeriodId ||
  (entry.isRetroactive ? 'Corte anterior' : '-');

const getEntryManualAdjustment = (entry: HrCommissionEntryRecord): number =>
  toMoneyNumber(entry.manualAdjustmentAmount ?? entry.adjustmentAmount);

const getEntryDeduction = (entry: HrCommissionEntryRecord): number =>
  toMoneyNumber(entry.deductionAmount ?? entry.deductionsAmount);

const getEntryTotal = (
  entry: HrCommissionEntryRecord,
  isRetroactive: boolean,
): number => {
  const baseCommission = isRetroactive ? 0 : entry.commissionAmount;
  const retroactiveAdjustment = isRetroactive ? entry.commissionAmount : 0;
  return (
    baseCommission +
    retroactiveAdjustment -
    getEntryManualAdjustment(entry) -
    getEntryDeduction(entry)
  );
};

const getEntryRateLabel = (entry: HrCommissionEntryRecord): string =>
  entry.rateType === 'fixed'
    ? formatMoney(entry.rateValue, entry.currency)
    : `${entry.rateValue}%`;

const buildLineFormula = (
  line: HrPayrollEmployeeLineRecord,
  currency: string,
  retroactiveAdjustmentAmount: number,
  manualAdjustmentAmount: number,
  deductionAmount: number,
): string => {
  const parts = [`Comisión normal ${formatMoney(line.commissionAmount, currency)}`];

  if (retroactiveAdjustmentAmount > 0) {
    parts.push(`retroactiva ${formatMoney(retroactiveAdjustmentAmount, currency)}`);
  }

  if (manualAdjustmentAmount > 0) {
    parts.push(`ajuste manual ${formatMoney(manualAdjustmentAmount, currency)}`);
  }

  if (deductionAmount > 0) {
    parts.push(`deducciones -${formatMoney(deductionAmount, currency)}`);
  }

  return `${parts.join(' + ')} = ${formatMoney(line.netAmount, currency)}`;
};

export function HrCommissionPeriodLineBreakdown({
  entries,
  lines,
  loading = false,
}: HrCommissionPeriodLineBreakdownProps) {
  if (loading) {
    return (
      <LineBreakdownStack aria-live="polite">
        <LineBreakdownTitle>Desglose operativo por colaborador</LineBreakdownTitle>
        <EmptyBreakdown>Cargando desglose de comisiones...</EmptyBreakdown>
      </LineBreakdownStack>
    );
  }

  if (!lines.length) return null;

  return (
    <LineBreakdownStack>
      <LineBreakdownTitle>Desglose operativo por colaborador</LineBreakdownTitle>
      {lines.map((line) => {
        const lineEntries = entries.filter((entry) =>
          entryMatchesLine(entry, line),
        );
        const currency = line.currency;
        const retroactiveAdjustmentAmount =
          line.retroactiveAdjustmentAmount ?? 0;
        const manualAdjustmentAmount = line.manualAdjustmentAmount ?? 0;
        const deductionAmount = getLineDeductionAmount(line);

        return (
          <LineBreakdownItem key={line.id} open>
            <LineBreakdownSummary>
              <BreakdownMetric>
                {getEmployeeLabel(line)}
                <BreakdownMetricLabel>
                  {line.employeeCode || line.employeeId} ·{' '}
                  {lineEntries.length || line.entriesCount} entradas
                </BreakdownMetricLabel>
              </BreakdownMetric>
              <BreakdownMetric>
                {formatMoney(line.commissionAmount, currency)}
                <BreakdownMetricLabel>Comisión normal</BreakdownMetricLabel>
              </BreakdownMetric>
              {retroactiveAdjustmentAmount > 0 ? (
                <BreakdownMetric>
                  {formatMoney(retroactiveAdjustmentAmount, currency)}
                  <BreakdownMetricLabel>Ajuste retroactivo</BreakdownMetricLabel>
                </BreakdownMetric>
              ) : null}
              {manualAdjustmentAmount > 0 ? (
                <BreakdownMetric>
                  {formatMoney(manualAdjustmentAmount, currency)}
                  <BreakdownMetricLabel>Ajuste manual</BreakdownMetricLabel>
                </BreakdownMetric>
              ) : null}
              {deductionAmount > 0 ? (
                <BreakdownMetric>
                  {formatMoney(deductionAmount, currency)}
                  <BreakdownMetricLabel>Deducciones</BreakdownMetricLabel>
                </BreakdownMetric>
              ) : null}
              <BreakdownMetric>
                {formatMoney(line.netAmount, currency)}
                <BreakdownMetricLabel>
                  Neto · pendiente{' '}
                  {formatMoney(getLinePendingAmount(line), currency)}
                </BreakdownMetricLabel>
              </BreakdownMetric>
            </LineBreakdownSummary>
            <LineBreakdownBody>
              <LineBreakdownFormula>
                <strong>Cómo se calculó:</strong>{' '}
                {buildLineFormula(
                  line,
                  currency,
                  retroactiveAdjustmentAmount,
                  manualAdjustmentAmount,
                  deductionAmount,
                )}
              </LineBreakdownFormula>
              <LineBreakdownNote>
                Retroactivas, ajustes manuales y deducciones se muestran como
                conceptos separados para evitar mezclar el origen del monto.
              </LineBreakdownNote>
              {lineEntries.length ? (
                <EntryTableScroll>
                  <EntryTable>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Factura</th>
                        <th>Cliente</th>
                        <th>Servicio</th>
                        <th>Referencia</th>
                        <th data-align="right">Base</th>
                        <th data-align="right">Tasa</th>
                        <th data-align="right">Comisión</th>
                        <th data-align="right">Retroactiva</th>
                        <th data-align="right">Ajuste manual</th>
                        <th data-align="right">Deducción</th>
                        <th data-align="right">Total</th>
                        <th>Corte original</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineEntries.map((entry) => {
                        const isRetroactive = Boolean(
                          entry.isRetroactive ||
                            line.retroactiveEntryIds?.includes(entry.id),
                        );
                        const normalCommission = isRetroactive
                          ? 0
                          : entry.commissionAmount;
                        const retroactiveAdjustment = isRetroactive
                          ? entry.commissionAmount
                          : 0;

                        return (
                          <tr key={entry.id}>
                            <td>{formatHrDate(entry.date)}</td>
                            <td>{entry.invoiceNumber || entry.invoiceId || '-'}</td>
                            <td>
                              {entry.customerNameSnapshot ||
                                entry.customerId ||
                                '-'}
                            </td>
                            <td>{entry.serviceName || entry.serviceId || '-'}</td>
                            <td>{getEntrySourceReference(entry)}</td>
                            <td data-align="right">
                              {formatMoney(entry.baseAmount, entry.currency)}
                            </td>
                            <td data-align="right">
                              {getEntryRateLabel(entry)}
                            </td>
                            <td data-align="right">
                              {formatMoney(normalCommission, entry.currency)}
                            </td>
                            <td data-align="right">
                              {formatMoney(
                                retroactiveAdjustment,
                                entry.currency,
                              )}
                            </td>
                            <td data-align="right">
                              {formatMoney(
                                getEntryManualAdjustment(entry),
                                entry.currency,
                              )}
                            </td>
                            <td data-align="right">
                              {formatMoney(getEntryDeduction(entry), entry.currency)}
                            </td>
                            <td data-align="right">
                              {formatMoney(
                                getEntryTotal(entry, isRetroactive),
                                entry.currency,
                              )}
                            </td>
                            <td>{getEntryOriginalCut(entry)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </EntryTable>
                </EntryTableScroll>
              ) : (
                <TraceabilityWarning role="note">
                  <TraceabilityWarningTitle>
                    Trazabilidad pendiente
                  </TraceabilityWarningTitle>
                  <span>
                    No hay facturas enlazadas a esta comisión. Este monto viene
                    del consolidado del corte; recalcula el corte para
                    reconstruir factura, base y tasa.
                  </span>
                </TraceabilityWarning>
              )}
            </LineBreakdownBody>
          </LineBreakdownItem>
        );
      })}
    </LineBreakdownStack>
  );
}
