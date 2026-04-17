import { DownloadOutlined } from '@ant-design/icons';
import { Alert, Button, Select, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { fbExportDgiiTxtReport } from '@/firebase/accounting/fbExportDgiiTxtReport';
import { fbRunMonthlyComplianceReport } from '@/firebase/accounting/fbRunMonthlyComplianceReport';

import { useMonthlyComplianceRuns } from '../hooks/useMonthlyComplianceRuns';
import { formatAccountingPeriod } from '../utils/accountingWorkspace';
import {
  MONTHLY_COMPLIANCE_REPORT_OPTIONS,
  buildMonthlyComplianceDefaultPeriodKey,
  formatMonthlyComplianceRunDate,
  getMonthlyComplianceSourceCount,
  resolveMonthlyComplianceStatusLabel,
  resolveMonthlyComplianceStatusTone,
  type MonthlyComplianceRun,
} from '../utils/monthlyCompliance';

interface MonthlyComplianceSectionProps {
  businessId: string | null;
  enabled: boolean;
  periods: string[];
  defaultPeriodKey: string | null;
}

const getStatusTagColor = (status: string) => {
  const tone = resolveMonthlyComplianceStatusTone(status);
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  return 'default';
};

const normalizeIssueLabel = (value: unknown) =>
  typeof value === 'string' && value.trim().length ? value : 'Sin detalle';

export const MonthlyComplianceSection = ({
  businessId,
  enabled,
  periods,
  defaultPeriodKey,
}: MonthlyComplianceSectionProps) => {
  const [reportCode, setReportCode] = useState<'DGII_606' | 'DGII_607' | 'DGII_608'>(
    'DGII_607',
  );
  const [requestedPeriodKey, setRequestedPeriodKey] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { error, loading, runs } = useMonthlyComplianceRuns({
    businessId,
    enabled,
  });

  const effectivePeriodKey =
    requestedPeriodKey ||
    defaultPeriodKey ||
    buildMonthlyComplianceDefaultPeriodKey();
  const periodOptions = useMemo(() => {
    const uniquePeriods = Array.from(
      new Set([effectivePeriodKey, ...periods].filter(Boolean)),
    );

    return uniquePeriods.map((period) => ({
      label: formatAccountingPeriod(period),
      value: period,
    }));
  }, [effectivePeriodKey, periods]);
  const filteredRuns = useMemo(
    () =>
      runs.filter(
        (run) =>
          run.reportCode === reportCode && run.periodKey === effectivePeriodKey,
      ),
    [effectivePeriodKey, reportCode, runs],
  );
  const effectiveSelectedRunId =
    selectedRunId && filteredRuns.some((run) => run.id === selectedRunId)
      ? selectedRunId
      : filteredRuns[0]?.id ?? null;
  const selectedRun =
    filteredRuns.find((run) => run.id === effectiveSelectedRunId) ?? null;

  const handleRun = async () => {
    if (!businessId) {
      message.error('No hay negocio activo para correr compliance mensual.');
      return;
    }

    setRunning(true);
    try {
      const result = await fbRunMonthlyComplianceReport({
        businessId,
        periodKey: effectivePeriodKey,
        reportCode,
      });

      message.success(
        `Corrida ${result.reportCode} v${result.version} creada. Issues: ${result.issueSummary.total}.`,
      );
    } catch (error) {
      console.error('Error ejecutando compliance mensual:', error);
      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo generar la corrida mensual.',
      );
    } finally {
      setRunning(false);
    }
  };

  const handleExportTxt = async () => {
    if (!businessId) {
      void message.error('No hay negocio activo para exportar.');
      return;
    }

    setExporting(true);
    try {
      const result = await fbExportDgiiTxtReport({
        businessId,
        periodKey: effectivePeriodKey,
        reportCode,
      });

      const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);

      void message.success(`${result.fileName} generado (${result.rowCount} filas).`);
    } catch (error) {
      console.error('Error exportando TXT DGII:', error);
      void message.error(
        error instanceof Error ? error.message : 'No se pudo generar el archivo TXT.',
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <ReportSection>
      <SectionHeader>
        <div>
          <ReportTitle>Compliance mensual DGII</ReportTitle>
          <SectionDescription>
            Ejecuta previews auditables 606, 607 y 608 desde contabilidad.
          </SectionDescription>
        </div>

        <Toolbar>
          <Select
            value={reportCode}
            options={MONTHLY_COMPLIANCE_REPORT_OPTIONS}
            onChange={(value) => setReportCode(value)}
            style={{ minWidth: 140 }}
          />
          <Select
            value={effectivePeriodKey}
            options={periodOptions}
            onChange={setRequestedPeriodKey}
            style={{ minWidth: 220 }}
          />
          <Button type="primary" loading={running} onClick={() => void handleRun()}>
            Ejecutar preview
          </Button>
          <Button
            icon={<DownloadOutlined />}
            loading={exporting}
            disabled={reportCode !== 'DGII_607'}
            title={reportCode !== 'DGII_607' ? 'Exportación TXT disponible solo para 607' : undefined}
            onClick={() => void handleExportTxt()}
          >
            Exportar TXT
          </Button>
        </Toolbar>
      </SectionHeader>

      {error ? (
        <Alert
          type="error"
          showIcon
          message="No se pudieron cargar las corridas de compliance mensual."
          description={error}
        />
      ) : null}

      <SummaryStrip>
        <SummaryItem>
          <span>Corridas visibles</span>
          <strong>{filteredRuns.length}</strong>
        </SummaryItem>
        <SummaryItem $warning={Boolean(selectedRun?.validationSummary.totalIssues)}>
          <span>Issues corrida activa</span>
          <strong>{selectedRun?.validationSummary.totalIssues ?? 0}</strong>
        </SummaryItem>
        <SummaryItem>
          <span>Estado activo</span>
          <strong>
            {selectedRun
              ? resolveMonthlyComplianceStatusLabel(selectedRun.status)
              : loading
                ? 'Cargando'
                : 'Sin corridas'}
          </strong>
        </SummaryItem>
      </SummaryStrip>

      {!filteredRuns.length ? (
        <EmptyText>
          {loading
            ? 'Cargando corridas de compliance mensual...'
            : `No hay corridas ${reportCode} para ${formatAccountingPeriod(
                effectivePeriodKey,
              )}.`}
        </EmptyText>
      ) : (
        <RunsGrid>
          <RunsList>
            {filteredRuns.map((run) => (
              <RunItemButton
                key={run.id}
                type="button"
                $selected={run.id === effectiveSelectedRunId}
                onClick={() => setSelectedRunId(run.id)}
              >
                <RunItemTop>
                  <strong>
                    {run.reportCode} · v{run.version}
                  </strong>
                  <Tag color={getStatusTagColor(run.status)}>
                    {resolveMonthlyComplianceStatusLabel(run.status)}
                  </Tag>
                </RunItemTop>
                <span>{formatMonthlyComplianceRunDate(run.createdAt)}</span>
                <span>{run.validationSummary.totalIssues} issues</span>
              </RunItemButton>
            ))}
          </RunsList>

          <RunDetails>
            {selectedRun ? (
              <SelectedRunDetails run={selectedRun} />
            ) : (
              <EmptyText>Selecciona una corrida para ver detalle.</EmptyText>
            )}
          </RunDetails>
        </RunsGrid>
      )}
    </ReportSection>
  );
};

const SelectedRunDetails = ({ run }: { run: MonthlyComplianceRun }) => {
  const sourceSnapshots = run.sourceSnapshot.sourceSnapshots;
  const visibleIssues = run.issues.slice(0, 6);

  return (
    <>
      <DetailHeader>
        <div>
          <ReportTitle>
            {run.reportCode} · {formatAccountingPeriod(run.periodKey)}
          </ReportTitle>
          <SectionDescription>
            Creado {formatMonthlyComplianceRunDate(run.createdAt)}
          </SectionDescription>
        </div>
        <Tag color={getStatusTagColor(run.status)}>
          {resolveMonthlyComplianceStatusLabel(run.status)}
        </Tag>
      </DetailHeader>

      <MiniStats>
        <MiniStat>
          <span>Registros cargados</span>
          <strong>
            {Object.keys(sourceSnapshots).reduce(
              (total, sourceId) =>
                total +
                getMonthlyComplianceSourceCount(
                  sourceSnapshots,
                  sourceId,
                  'recordsLoaded',
                ),
              0,
            )}
          </strong>
        </MiniStat>
        <MiniStat>
          <span>Excluidos</span>
          <strong>
            {Object.keys(sourceSnapshots).reduce(
              (total, sourceId) =>
                total +
                getMonthlyComplianceSourceCount(
                  sourceSnapshots,
                  sourceId,
                  'recordsExcluded',
                ),
              0,
            )}
          </strong>
        </MiniStat>
        <MiniStat>
          <span>Fuentes</span>
          <strong>{run.validationSummary.sourceSummaries.length}</strong>
        </MiniStat>
      </MiniStats>

      <SourceList>
        {run.validationSummary.sourceSummaries.map((summary) => (
          <SourceRow key={summary.sourceId}>
            <span>{summary.sourceId}</span>
            <strong>{summary.recordsScanned}</strong>
          </SourceRow>
        ))}
      </SourceList>

      {run.validationSummary.pendingGaps.length ? (
        <Alert
          type="warning"
          showIcon
          message="Huecos pendientes del builder"
          description={
            <GapList>
              {run.validationSummary.pendingGaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </GapList>
          }
        />
      ) : null}

      <IssueSection>
        <IssueHeader>
          <ReportTitle>Issues</ReportTitle>
          <strong>{run.validationSummary.totalIssues}</strong>
        </IssueHeader>
        {!visibleIssues.length ? (
          <EmptyText>Sin issues para esta corrida.</EmptyText>
        ) : (
          <IssueList>
            {visibleIssues.map((issue, index) => (
              <IssueItem key={`${run.id}-issue-${index}`}>
                <IssueTop>
                  <Tag color={issue.severity === 'error' ? 'error' : 'warning'}>
                    {normalizeIssueLabel(issue.severity)}
                  </Tag>
                  <strong>{normalizeIssueLabel(issue.code)}</strong>
                </IssueTop>
                <span>
                  {normalizeIssueLabel(issue.sourceId)} ·{' '}
                  {normalizeIssueLabel(issue.fieldPath)}
                </span>
                <span>{normalizeIssueLabel(issue.documentNumber)}</span>
              </IssueItem>
            ))}
          </IssueList>
        )}
      </IssueSection>
    </>
  );
};

const ReportSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const SectionHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
`;

const ReportTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const SectionDescription = styled.p`
  margin: var(--ds-space-1) 0 0;
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

const SummaryItem = styled.div<{ $warning?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-4);
  border: 1px solid
    ${({ $warning }) =>
      $warning
        ? 'var(--ds-color-state-warning-subtle)'
        : 'var(--ds-color-border-default)'};
  border-radius: var(--ds-radius-lg);
  background: ${({ $warning }) =>
    $warning
      ? 'var(--ds-color-state-warning-subtle)'
      : 'var(--ds-color-bg-surface)'};

  span {
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    text-transform: uppercase;
    letter-spacing: var(--ds-letter-spacing-wide);
    color: var(--ds-color-text-secondary);
  }
`;

const EmptyText = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
`;

const RunsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: var(--ds-space-4);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const RunsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
`;

const RunItemButton = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  align-items: flex-start;
  padding: var(--ds-space-3);
  border: 1px solid
    ${({ $selected }) =>
      $selected
        ? 'var(--ds-color-accent-primary)'
        : 'var(--ds-color-border-default)'};
  border-radius: var(--ds-radius-md);
  background: ${({ $selected }) =>
    $selected
      ? 'var(--ds-color-bg-surface-hover)'
      : 'var(--ds-color-bg-surface)'};
  color: inherit;
  cursor: pointer;

  span {
    color: var(--ds-color-text-secondary);
    text-align: left;
  }
`;

const RunItemTop = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: var(--ds-space-2);
  align-items: center;
`;

const RunDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-3);
  align-items: flex-start;
`;

const MiniStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const MiniStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-3);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface-hover);

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
    text-transform: uppercase;
  }
`;

const SourceList = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--ds-color-border-subtle);
`;

const SourceRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) 0;
  border-bottom: 1px solid var(--ds-color-border-subtle);

  span {
    color: var(--ds-color-text-secondary);
  }
`;

const GapList = styled.ul`
  margin: 0;
  padding-left: var(--ds-space-4);
`;

const IssueSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
`;

const IssueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-3);
  align-items: center;
`;

const IssueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
`;

const IssueItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface-hover);

  span {
    color: var(--ds-color-text-secondary);
  }
`;

const IssueTop = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
`;
