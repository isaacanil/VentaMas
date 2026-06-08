import {
  Alert,
  Button,
  Card,
  SearchField,
  Surface,
} from '@heroui/react';
import { message } from 'antd';
import { useState } from 'react';

import { FileExcelOutlined, InfoCircleOutlined } from '@/constants/icons/antd';

import {
  formatAccountingMoney,
  formatAccountingPeriod,
} from '../utils/accountingWorkspace';
import { useAccountingBackendReports } from '../hooks/useAccountingBackendReports';
import { exportFinancialReportsWorkbook } from './utils/financialReportsExport';

import type { TrialBalanceRow } from '../utils/accountingWorkspace';

interface FinancialReportsPanelProps {
  businessId: string | null;
  enabled: boolean;
}

export const FinancialReportsPanel = ({
  businessId,
  enabled,
}: FinancialReportsPanelProps) => {
  const [periodKey, setPeriodKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const {
    error,
    financialReports: reports,
    loading,
    periods,
    selectedReportPeriodKey,
  } = useAccountingBackendReports({
    businessId,
    enabled,
    includeFinancialReports: true,
    includeGeneralLedger: false,
    reportPeriodKey: periodKey || null,
  });
  const selectedPeriodKey = selectedReportPeriodKey ?? periodKey;

  const handleExport = async () => {
    if (!selectedPeriodKey || !reports) {
      message.error('No hay reportes disponibles para exportar.');
      return;
    }

    setExporting(true);
    try {
      await exportFinancialReportsWorkbook({
        periodKey: selectedPeriodKey,
        reports,
      });
      message.success('Reporte exportado a Excel.');
    } catch (error) {
      console.error('Error exportando reportes financieros:', error);
      message.error('No se pudo exportar el reporte a Excel.');
    } finally {
      setExporting(false);
    }
  };

  const filteredTrialBalance = reports?.trialBalance.filter((row) => {
    const query = searchQuery.toLowerCase();
    return (
      row.name.toLowerCase().includes(query) || row.code.includes(searchQuery)
    );
  });

  return (
    <div className="flex flex-col gap-5 py-6 pb-8">
      {selectedPeriodKey && reports ? (
        <>
          <Surface
            variant="secondary"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-3">
              <select
                aria-label="Periodo de reporte financiero"
                className="min-w-[220px] rounded-lg border border-subtle bg-surface px-3 py-2 text-sm text-primary shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                value={selectedPeriodKey}
                onChange={(event) => {
                  setPeriodKey(event.target.value);
                }}
              >
                {periods.map((period) => (
                  <option key={period} value={period}>
                    {formatAccountingPeriod(period)}
                  </option>
                ))}
              </select>

              <SearchField
                variant="secondary"
                aria-label="Buscar cuenta"
                value={searchQuery}
                onChange={setSearchQuery}
              >
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input
                    className="w-[240px]"
                    placeholder="Buscar cuenta o código..."
                  />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
            </div>

            <Button
              variant="outline"
              isPending={exporting}
              onPress={() => {
                void handleExport();
              }}
            >
              {exporting ? null : <FileExcelOutlined />}
              Exportar Excel
            </Button>
          </Surface>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Debitos acumulados"
              value={formatAccountingMoney(reports.trialBalanceTotals.debit)}
              tooltip="Suma de debitos registrada hasta el cierre del periodo seleccionado."
            />
            <SummaryCard
              label="Creditos acumulados"
              value={formatAccountingMoney(reports.trialBalanceTotals.credit)}
              tooltip="Suma de creditos registrada hasta el cierre del periodo seleccionado."
            />
            <SummaryCard
              isNegative={reports.incomeTotals.netIncome < 0}
              label="Resultado neto del periodo"
              value={formatAccountingMoney(reports.incomeTotals.netIncome)}
              tooltip="Ingresos menos gastos del periodo seleccionado; no representa el acumulado historico."
            />
          </div>

          <Card className="flex flex-col gap-3 p-5">
            <h3 className="m-0 text-md font-semibold text-primary">
              Balanza de comprobación
            </h3>
            <div className="overflow-x-auto rounded-lg border border-subtle">
              <table
                aria-label="Balanza de comprobacion"
                className="min-w-full border-collapse text-left text-sm"
              >
                <thead className="bg-surface-subtle text-secondary">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cuenta</th>
                    <th className="px-4 py-3 font-medium">Debito</th>
                    <th className="px-4 py-3 font-medium">Credito</th>
                    <th className="px-4 py-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredTrialBalance ?? []).map((row) => (
                    <tr
                      key={row.accountId}
                      className="border-t border-subtle"
                    >
                      <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <strong className="font-semibold text-primary">
                              {row.code}
                            </strong>
                            <span className="text-sm text-secondary">
                              {row.name}
                            </span>
                          </div>
                      </td>
                      <td className="px-4 py-3">
                          <span className="tabular-nums text-right">
                            {formatAccountingMoney(row.debit)}
                          </span>
                      </td>
                      <td className="px-4 py-3">
                          <span className="tabular-nums text-right">
                            {formatAccountingMoney(row.credit)}
                          </span>
                      </td>
                      <td className="px-4 py-3">
                          <span className="tabular-nums text-right">
                            {formatAccountingMoney(row.balance)}
                          </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="flex flex-col gap-3 p-5">
              <h3 className="m-0 text-md font-semibold text-primary">
                Estado de resultados
              </h3>
              <div className="flex flex-col">
                {reports.incomeRows.map((row) => (
                  <CompactRow
                    key={row.accountId}
                    label={`${row.code} · ${row.name}`}
                    value={formatAccountingMoney(row.amount)}
                  />
                ))}
                <div className="flex justify-between border-t border-subtle py-3 font-semibold">
                  <span className="text-secondary">Utilidad neta</span>
                  <strong
                    className={`min-w-[128px] text-right tabular-nums ${
                      reports.incomeTotals.netIncome < 0 ? 'text-danger' : ''
                    }`}
                  >
                    {formatAccountingMoney(reports.incomeTotals.netIncome)}
                  </strong>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col gap-3 p-5">
              <h3 className="m-0 text-md font-semibold text-primary">
                Balance general
              </h3>
              <div className="flex flex-col gap-4">
                <BalanceGroup
                  title="Activos"
                  rows={reports.balanceSheet.assets}
                />
                <BalanceGroup
                  title="Pasivos"
                  rows={reports.balanceSheet.liabilities}
                />
                <BalanceGroup
                  title="Patrimonio"
                  rows={reports.balanceSheet.equity}
                />
                <div className="flex justify-between border-t border-subtle py-3 font-semibold">
                  <span className="text-secondary">
                    Resultado acumulado del periodo
                  </span>
                  <strong className="min-w-[128px] text-right tabular-nums">
                    {formatAccountingMoney(
                      reports.balanceSheet.currentEarnings,
                    )}
                  </strong>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              No se pudieron cargar los reportes financieros.
            </Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <p className="m-0 text-base leading-normal text-secondary">
          {loading
            ? 'Cargando reportes financieros...'
            : 'No hay periodos disponibles para generar reportes.'}
        </p>
      )}
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  tooltip,
  isNegative,
}: {
  label: string;
  value: string;
  tooltip: string;
  isNegative?: boolean;
}) => (
  <Card
    className={`flex flex-col gap-1 p-4 ${
      isNegative ? 'border-danger-subtle bg-danger-subtle' : ''
    }`}
  >
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-secondary">
        {label}
      </span>
      <InfoCircleOutlined
        className="cursor-help text-sm text-muted"
        title={tooltip}
      />
    </div>
    <strong
      className={`text-md tabular-nums leading-tight ${
        isNegative ? 'text-danger' : 'text-primary'
      }`}
    >
      {value}
    </strong>
  </Card>
);

const CompactRow = ({
  label,
  value,
  isNegative,
}: {
  label: string;
  value: string;
  isNegative?: boolean;
}) => (
  <div className="flex justify-between gap-3 border-b border-subtle py-3">
    <span className="text-secondary">{label}</span>
    <strong
      className={`min-w-[128px] text-right font-medium tabular-nums ${
        isNegative ? 'text-danger' : 'text-primary'
      }`}
    >
      {value}
    </strong>
  </div>
);

const BalanceGroup = ({
  title,
  rows,
}: {
  title: string;
  rows: TrialBalanceRow[];
}) => (
  <div className="flex flex-col gap-1">
    <h4 className="m-0 text-xs font-semibold uppercase tracking-wide text-secondary">
      {title}
    </h4>
    {rows.map((row) => (
      <CompactRow
        key={row.accountId}
        label={`${row.code} · ${row.name}`}
        value={formatAccountingMoney(row.balance)}
      />
    ))}
  </div>
);
