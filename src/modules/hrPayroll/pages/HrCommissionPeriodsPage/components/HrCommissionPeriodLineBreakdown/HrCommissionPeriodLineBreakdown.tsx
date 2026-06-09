import {
  formatHrDate,
  formatHrMoney as formatMoney,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrCommissionEntryRecord,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';

import {
  BreakdownMetric,
  BreakdownMetricLabel,
  EmptyBreakdown,
  EntryTable,
  EntryTableScroll,
  LineBreakdownBody,
  LineBreakdownItem,
  LineBreakdownNote,
  LineBreakdownStack,
  LineBreakdownSummary,
  LineBreakdownTitle,
} from './HrCommissionPeriodLineBreakdown.styles';

interface HrCommissionPeriodLineBreakdownProps {
  entries: HrCommissionEntryRecord[];
  lines: HrPayrollEmployeeLineRecord[];
  loading?: boolean;
}

const toMoneyNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const getLineDeductionAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.deductionsAmount ||
  Math.max(
    0,
    (line.grossAmount || line.commissionAmount || line.netAmount) -
      line.netAmount,
  );

const getLinePaidAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.status === 'paid' ? line.netAmount : 0;

const getLinePendingAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.status === 'paid' || line.status === 'cancelled'
    ? 0
    : Math.max(0, line.netAmount - getLinePaidAmount(line));

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
          <LineBreakdownItem key={line.id}>
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
                <BreakdownMetricLabel>Comision normal</BreakdownMetricLabel>
              </BreakdownMetric>
              <BreakdownMetric>
                {formatMoney(retroactiveAdjustmentAmount, currency)}
                <BreakdownMetricLabel>Ajuste retroactivo</BreakdownMetricLabel>
              </BreakdownMetric>
              <BreakdownMetric>
                {formatMoney(manualAdjustmentAmount, currency)}
                <BreakdownMetricLabel>Ajuste manual</BreakdownMetricLabel>
              </BreakdownMetric>
              <BreakdownMetric>
                {formatMoney(deductionAmount, currency)}
                <BreakdownMetricLabel>Deducciones</BreakdownMetricLabel>
              </BreakdownMetric>
              <BreakdownMetric>
                {formatMoney(line.netAmount, currency)}
                <BreakdownMetricLabel>
                  Neto · pendiente{' '}
                  {formatMoney(getLinePendingAmount(line), currency)}
                </BreakdownMetricLabel>
              </BreakdownMetric>
            </LineBreakdownSummary>
            <LineBreakdownBody>
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
                        <th data-align="right">Comision</th>
                        <th data-align="right">Retroactiva</th>
                        <th data-align="right">Ajuste manual</th>
                        <th data-align="right">Deduccion</th>
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
                <EmptyBreakdown>
                  No hay entradas detalladas enlazadas a esta linea.
                </EmptyBreakdown>
              )}
            </LineBreakdownBody>
          </LineBreakdownItem>
        );
      })}
    </LineBreakdownStack>
  );
}
