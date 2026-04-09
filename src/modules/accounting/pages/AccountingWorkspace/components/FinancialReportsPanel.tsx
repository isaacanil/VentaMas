import { Alert, Button, Select, Tooltip, message } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

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

  if (!selectedPeriodKey || !reports) {
    return (
      <Panel>
        {error ? (
          <Alert
            type="error"
            showIcon
            message="No se pudieron cargar los reportes financieros."
            description={error}
          />
        ) : (
          <EmptyText>
            {loading
              ? 'Cargando reportes financieros...'
              : 'No hay periodos disponibles para generar reportes.'}
          </EmptyText>
        )}
      </Panel>
    );
  }

  return (
    <Panel>
      <Toolbar>
          <Select
            style={{ minWidth: 220 }}
            value={selectedPeriodKey}
            options={periods.map((period) => ({
              label: formatAccountingPeriod(period),
              value: period,
            }))}
            onChange={setPeriodKey}
          />
          <Button
            icon={<FileExcelOutlined />}
            loading={exporting}
            onClick={() => {
              void handleExport();
            }}
          >
            Exportar Excel
          </Button>
      </Toolbar>

      <SummaryStrip>
        <SummaryItem>
          <SummaryLabelRow>
            <span>Debitos acumulados</span>
            <Tooltip
              title="Suma de debitos registrada hasta el cierre del periodo seleccionado."
              placement="top"
            >
              <InfoIcon />
            </Tooltip>
          </SummaryLabelRow>
          <strong>{formatAccountingMoney(reports.trialBalanceTotals.debit)}</strong>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabelRow>
            <span>Creditos acumulados</span>
            <Tooltip
              title="Suma de creditos registrada hasta el cierre del periodo seleccionado."
              placement="top"
            >
              <InfoIcon />
            </Tooltip>
          </SummaryLabelRow>
          <strong>{formatAccountingMoney(reports.trialBalanceTotals.credit)}</strong>
        </SummaryItem>
        <SummaryItem $negative={reports.incomeTotals.netIncome < 0}>
          <SummaryLabelRow>
            <span>Resultado neto del periodo</span>
            <Tooltip
              title="Ingresos menos gastos del periodo seleccionado; no representa el acumulado historico."
              placement="top"
            >
              <InfoIcon />
            </Tooltip>
          </SummaryLabelRow>
          <strong>{formatAccountingMoney(reports.incomeTotals.netIncome)}</strong>
        </SummaryItem>
      </SummaryStrip>

      <ReportSection>
        <ReportTitle>Balanza de comprobacion</ReportTitle>
        <ReportTableShell>
          <ReportTable>
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Debito</th>
                <th>Credito</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {reports.trialBalance.map((row) => (
                <tr key={row.accountId}>
                  <td>
                    <strong>{row.code}</strong>
                    <span>{row.name}</span>
                  </td>
                  <td>{formatAccountingMoney(row.debit)}</td>
                  <td>{formatAccountingMoney(row.credit)}</td>
                  <td>{formatAccountingMoney(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </ReportTable>
        </ReportTableShell>
      </ReportSection>

      <DualReportGrid>
        <ReportSection>
          <ReportTitle>Estado de resultados</ReportTitle>
          <CompactList>
            {reports.incomeRows.map((row) => (
              <CompactRow key={row.accountId}>
                <span>
                  {row.code} · {row.name}
                </span>
                <strong>{formatAccountingMoney(row.amount)}</strong>
              </CompactRow>
            ))}
            <CompactTotal $negative={reports.incomeTotals.netIncome < 0}>
              <span>Utilidad neta</span>
              <strong>{formatAccountingMoney(reports.incomeTotals.netIncome)}</strong>
            </CompactTotal>
          </CompactList>
        </ReportSection>

        <ReportSection>
          <ReportTitle>Balance general</ReportTitle>
          <BalanceColumns>
            <BalanceGroup>
              <BalanceGroupTitle>Activos</BalanceGroupTitle>
              {reports.balanceSheet.assets.map((row) => (
                <BalanceRow key={row.accountId} row={row} />
              ))}
            </BalanceGroup>
            <BalanceGroup>
              <BalanceGroupTitle>Pasivos</BalanceGroupTitle>
              {reports.balanceSheet.liabilities.map((row) => (
                <BalanceRow key={row.accountId} row={row} />
              ))}
            </BalanceGroup>
            <BalanceGroup>
              <BalanceGroupTitle>Patrimonio</BalanceGroupTitle>
              {reports.balanceSheet.equity.map((row) => (
                <BalanceRow key={row.accountId} row={row} />
              ))}
              <CompactTotal>
                <span>Resultado acumulado del periodo</span>
                <strong>
                  {formatAccountingMoney(reports.balanceSheet.currentEarnings)}
                </strong>
              </CompactTotal>
            </BalanceGroup>
          </BalanceColumns>
        </ReportSection>
      </DualReportGrid>
    </Panel>
  );
};

const BalanceRow = ({ row }: { row: TrialBalanceRow }) => (
  <CompactRow>
    <span>
      {row.code} · {row.name}
    </span>
    <strong>{formatAccountingMoney(row.balance)}</strong>
  </CompactRow>
);

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  padding: var(--ds-space-6) 0 var(--ds-space-8);
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const SummaryStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryItem = styled.div<{ $negative?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-4);
  border: 1px solid
    ${({ $negative }) =>
      $negative
        ? 'var(--ds-color-state-danger-subtle)'
        : 'var(--ds-color-border-default)'};
  border-radius: var(--ds-radius-lg);
  background: ${({ $negative }) =>
    $negative
      ? 'var(--ds-color-state-danger-subtle)'
      : 'var(--ds-color-bg-surface)'};

  span {
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    text-transform: uppercase;
    letter-spacing: var(--ds-letter-spacing-wide);
    color: var(--ds-color-text-secondary);
  }

  strong {
    font-size: var(--ds-font-size-md);
    line-height: var(--ds-line-height-tight);
    color: ${({ $negative }) =>
      $negative
        ? 'var(--ds-color-state-danger-text)'
        : 'var(--ds-color-text-primary)'};
    font-variant-numeric: tabular-nums;
  }
`;

const SummaryLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
`;

const ReportSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const ReportTableShell = styled.div`
  overflow-x: auto;
`;

const ReportTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const ReportTable = styled.table`
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;

  th,
  td {
    padding: var(--ds-space-3) 0;
    border-bottom: 1px solid var(--ds-color-border-subtle);
    text-align: left;
  }

  th:first-child,
  td:first-child {
    width: 43%;
  }

  th:nth-child(n + 2),
  td:nth-child(n + 2) {
    width: 19%;
    text-align: right;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  th {
    font-size: var(--ds-font-size-xs);
    text-transform: uppercase;
    letter-spacing: var(--ds-letter-spacing-wide);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-secondary);
    border-bottom: 1px solid var(--ds-color-border-default);
  }

  td:first-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  td:first-child span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }
`;

const DualReportGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const CompactList = styled.div`
  display: flex;
  flex-direction: column;
`;

const CompactRow = styled.div<{ $negative?: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) 0;
  border-bottom: 1px solid var(--ds-color-border-subtle);

  span {
    color: var(--ds-color-text-secondary);
    line-height: var(--ds-line-height-normal);
  }

  strong {
    color: ${({ $negative }) =>
      $negative
        ? 'var(--ds-color-state-danger-text)'
        : 'var(--ds-color-text-primary)'};
    min-width: 128px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: var(--ds-font-weight-medium);
  }
`;

const CompactTotal = styled(CompactRow)`
  font-weight: var(--ds-font-weight-semibold);
`;

const InfoIcon = styled(InfoCircleOutlined)`
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  cursor: default;
`;

const BalanceColumns = styled.div`
  display: grid;
  gap: 16px;
`;

const BalanceGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
`;

const BalanceGroupTitle = styled.h4`
  margin: 0;
  font-size: var(--ds-font-size-xs);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-secondary);
`;
