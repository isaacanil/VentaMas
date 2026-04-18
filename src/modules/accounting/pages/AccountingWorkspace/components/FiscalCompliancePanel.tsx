import { DownloadOutlined } from '@ant-design/icons';
import { Alert, Button, Select, Tabs, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { fbExportDgiiTxtReport } from '@/firebase/accounting/fbExportDgiiTxtReport';
import {
  fbRunMonthlyComplianceReport,
  type MonthlyComplianceReportCode,
} from '@/firebase/accounting/fbRunMonthlyComplianceReport';

import { useMonthlyComplianceRuns } from '../hooks/useMonthlyComplianceRuns';
import { formatAccountingPeriod } from '../utils/accountingWorkspace';
import {
  translateFieldPath,
  translateIssueCode,
  translateSeverity,
  translateSourceId,
} from '../utils/fiscalIssueLabels';
import {
  MONTHLY_COMPLIANCE_REPORT_OPTIONS,
  buildMonthlyComplianceDefaultPeriodKey,
  formatMonthlyComplianceRunDate,
  getMonthlyComplianceSourceCount,
  resolveMonthlyComplianceStatusLabel,
  resolveMonthlyComplianceStatusTone,
  type MonthlyComplianceRun,
} from '../utils/monthlyCompliance';

interface FiscalCompliancePanelProps {
  businessId: string | null;
  enabled: boolean;
  periods: string[];
  defaultPeriodKey: string | null;
}

type FiscalComplianceTabKey =
  | 'summary'
  | 'DGII_607'
  | 'DGII_606'
  | 'DGII_608'
  | 'runs';

const REPORT_CODES: MonthlyComplianceReportCode[] = [
  'DGII_607',
  'DGII_606',
  'DGII_608',
];

const REPORT_LABELS: Record<MonthlyComplianceReportCode, string> = {
  DGII_606: '606',
  DGII_607: '607',
  DGII_608: '608',
};

const REPORT_DESCRIPTIONS: Record<MonthlyComplianceReportCode, string> = {
  DGII_606: 'Compras, gastos y pagos relacionados del periodo.',
  DGII_607: 'Ventas y retenciones sufridas por terceros.',
  DGII_608: 'Comprobantes anulados y documentos cancelados.',
};

const getStatusTone = (status: string) =>
  resolveMonthlyComplianceStatusTone(status);

const normalizeIssueLabel = (value: unknown) =>
  typeof value === 'string' && value.trim().length ? value : 'Sin detalle';

const toOptionalIssueLabel = (value: unknown) =>
  typeof value === 'string' && value.trim().length ? value.trim() : null;

interface GroupedFiscalIssue {
  key: string;
  severity: string;
  code: string;
  sourceId: string;
  documentNumber: string;
  fields: string[];
}

const groupFiscalIssues = (issues: MonthlyComplianceRun['issues']) => {
  const groups = new Map<
    string,
    {
      severity: string;
      code: string;
      sourceId: string;
      documentNumber: string;
      fields: Set<string>;
    }
  >();

  issues.forEach((issue) => {
    const severity = normalizeIssueLabel(issue.severity);
    const code = normalizeIssueLabel(issue.code);
    const sourceId = normalizeIssueLabel(issue.sourceId);
    const documentNumber = normalizeIssueLabel(issue.documentNumber);
    const recordId = toOptionalIssueLabel(issue.recordId);
    const fieldPath = toOptionalIssueLabel(issue.fieldPath);
    const issueKey = [severity, code, sourceId, documentNumber, recordId ?? ''].join('|');
    const existingGroup = groups.get(issueKey);

    if (existingGroup) {
      if (fieldPath) {
        existingGroup.fields.add(translateFieldPath(fieldPath));
      }
      return;
    }

    groups.set(issueKey, {
      severity,
      code,
      sourceId,
      documentNumber,
      fields: new Set(
        fieldPath ? [translateFieldPath(fieldPath)] : [],
      ),
    });
  });

  return Array.from(groups.entries()).map(
    ([key, group]): GroupedFiscalIssue => ({
      key,
      severity: group.severity,
      code: group.code,
      sourceId: group.sourceId,
      documentNumber: group.documentNumber,
      fields: Array.from(group.fields),
    }),
  );
};

const resolveReportOptionLabel = (reportCode: MonthlyComplianceReportCode) =>
  MONTHLY_COMPLIANCE_REPORT_OPTIONS.find(
    (option) => option.value === reportCode,
  )?.label ?? reportCode;

const isReportTab = (
  tab: FiscalComplianceTabKey,
): tab is MonthlyComplianceReportCode =>
  REPORT_CODES.includes(tab as MonthlyComplianceReportCode);

export const FiscalCompliancePanel = ({
  businessId,
  enabled,
  periods,
  defaultPeriodKey,
}: FiscalCompliancePanelProps) => {
  const [activeTab, setActiveTab] = useState<FiscalComplianceTabKey>('summary');
  const [requestedPeriodKey, setRequestedPeriodKey] = useState('');
  const [selectedRunIds, setSelectedRunIds] = useState<
    Partial<Record<MonthlyComplianceReportCode, string | null>>
  >({});
  const [selectedOverviewRunId, setSelectedOverviewRunId] = useState<
    string | null
  >(null);
  const [running, setRunning] = useState(false);
  const [exportingReportCode, setExportingReportCode] =
    useState<MonthlyComplianceReportCode | null>(null);
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

  const currentPeriodRuns = useMemo(
    () => runs.filter((run) => run.periodKey === effectivePeriodKey),
    [effectivePeriodKey, runs],
  );

  const reportRunsByCode = useMemo(
    () =>
      REPORT_CODES.reduce(
        (accumulator, reportCode) => ({
          ...accumulator,
          [reportCode]: currentPeriodRuns.filter(
            (run) => run.reportCode === reportCode,
          ),
        }),
        {} as Record<MonthlyComplianceReportCode, MonthlyComplianceRun[]>,
      ),
    [currentPeriodRuns],
  );

  const selectedOverviewRun =
    selectedOverviewRunId &&
    currentPeriodRuns.some((run) => run.id === selectedOverviewRunId)
      ? (currentPeriodRuns.find((run) => run.id === selectedOverviewRunId) ??
        null)
      : (currentPeriodRuns[0] ?? null);

  const totalIssuesAcrossPeriod = currentPeriodRuns.reduce(
    (total, run) => total + run.validationSummary.totalIssues,
    0,
  );
  const totalValidatedRuns = currentPeriodRuns.filter(
    (run) => run.status === 'validated',
  ).length;

  const handleRun = async (reportCode: MonthlyComplianceReportCode) => {
    if (!businessId) {
      message.error('No hay negocio activo para correr cumplimiento fiscal.');
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
        `Corrida ${resolveReportOptionLabel(result.reportCode)} v${result.version} creada. Issues: ${result.issueSummary.total}.`,
      );
      setActiveTab(reportCode);
    } catch (error) {
      console.error('Error ejecutando compliance mensual:', error);
      message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo generar la corrida fiscal.',
      );
    } finally {
      setRunning(false);
    }
  };

  const handleExportTxt = async (reportCode: MonthlyComplianceReportCode) => {
    if (!businessId) {
      void message.error('No hay negocio activo para exportar.');
      return;
    }

    setExportingReportCode(reportCode);
    try {
      const result = await fbExportDgiiTxtReport({
        businessId,
        periodKey: effectivePeriodKey,
        reportCode,
      });

      const blob = new Blob([result.content], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);

      void message.success(
        `${REPORT_LABELS[reportCode]} generado: ${result.fileName} (${result.rowCount} filas).`,
      );
    } catch (error) {
      console.error('Error exportando TXT DGII:', error);
      void message.error(
        error instanceof Error
          ? error.message
          : 'No se pudo generar el archivo TXT.',
      );
    } finally {
      setExportingReportCode(null);
    }
  };

  const renderReportWorkspace = (reportCode: MonthlyComplianceReportCode) => {
    const reportRuns = reportRunsByCode[reportCode];
    const selectedRunId = selectedRunIds[reportCode];
    const selectedRun =
      selectedRunId && reportRuns.some((run) => run.id === selectedRunId)
        ? (reportRuns.find((run) => run.id === selectedRunId) ?? null)
        : (reportRuns[0] ?? null);

    return (
      <ReportWorkspace>
        <ReportLead>
          <ReportLeadText>
            <ReportLeadTitle>DGII {REPORT_LABELS[reportCode]}</ReportLeadTitle>
            <SectionDescription>
              {REPORT_DESCRIPTIONS[reportCode]}
            </SectionDescription>
          </ReportLeadText>
          <ActionCluster>
            <Button
              type="primary"
              loading={running}
              onClick={() => void handleRun(reportCode)}
            >
              Generar borrador
            </Button>
            {reportCode === 'DGII_607' || reportCode === 'DGII_608' ? (
              <Button
                icon={<DownloadOutlined />}
                loading={exportingReportCode === reportCode}
                onClick={() => void handleExportTxt(reportCode)}
              >
                Exportar TXT
              </Button>
            ) : null}
            <Button onClick={() => setActiveTab('runs')}>
              Ver corridas e issues
            </Button>
          </ActionCluster>
        </ReportLead>

        <SummaryStrip>
          <SummaryItem>
            <span>Corridas visibles</span>
            <strong>{reportRuns.length}</strong>
          </SummaryItem>
          <SummaryItem
            $warning={Boolean(selectedRun?.validationSummary.totalIssues)}
          >
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

        {!reportRuns.length ? (
          <EmptyStateCard>
            <strong>Sin corridas para este reporte.</strong>
            <span>
              Genera un borrador {REPORT_LABELS[reportCode]} para{' '}
              {formatAccountingPeriod(effectivePeriodKey)} y revisa los issues
              antes de exportar.
            </span>
          </EmptyStateCard>
        ) : (
          <RunsGrid>
            <RunsList>
              {reportRuns.map((run) => (
                <RunItemButton
                  key={run.id}
                  type="button"
                  $selected={run.id === selectedRun?.id}
                  $tone={resolveMonthlyComplianceStatusTone(run.status)}
                  onClick={() =>
                    setSelectedRunIds((currentValue) => ({
                      ...currentValue,
                      [reportCode]: run.id,
                    }))
                  }
                >
                  <RunItemTop>
                    <strong>
                      {REPORT_LABELS[reportCode]} · v{run.version}
                    </strong>
                    <StatusTag $tone={getStatusTone(run.status)}>
                      {resolveMonthlyComplianceStatusLabel(run.status)}
                    </StatusTag>
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
      </ReportWorkspace>
    );
  };

  const tabItems = [
    {
      key: 'summary',
      label: 'Resumen',
      children: (
        <SummaryView>
          <SummaryStrip>
            <SummaryItem>
              <span>Corridas del periodo</span>
              <strong>{currentPeriodRuns.length}</strong>
            </SummaryItem>
            <SummaryItem $warning={totalIssuesAcrossPeriod > 0}>
              <span>Issues visibles</span>
              <strong>{totalIssuesAcrossPeriod}</strong>
            </SummaryItem>
            <SummaryItem>
              <span>Corridas validadas</span>
              <strong>{totalValidatedRuns}</strong>
            </SummaryItem>
          </SummaryStrip>

          <ReportCardsGrid>
            {REPORT_CODES.map((reportCode) => {
              const reportRuns = reportRunsByCode[reportCode];
              const latestRun = reportRuns[0] ?? null;

              return (
                <ReportCard key={reportCode}>
                  <ReportCardTop>
                    <div>
                      <ReportCardTitle>
                        DGII {REPORT_LABELS[reportCode]}
                      </ReportCardTitle>
                      <ReportCardDescription>
                        {REPORT_DESCRIPTIONS[reportCode]}
                      </ReportCardDescription>
                    </div>
                    <StatusTag
                      $tone={latestRun ? getStatusTone(latestRun.status) : 'neutral'}
                    >
                      {latestRun
                        ? resolveMonthlyComplianceStatusLabel(latestRun.status)
                        : 'Sin corrida'}
                    </StatusTag>
                  </ReportCardTop>

                  <ReportCardStats>
                    <ReportCardStat>
                      <span>Corridas</span>
                      <strong>{reportRuns.length}</strong>
                    </ReportCardStat>
                    <ReportCardStat
                      $warning={Boolean(
                        latestRun?.validationSummary.totalIssues,
                      )}
                    >
                      <span>Issues</span>
                      <strong>
                        {latestRun?.validationSummary.totalIssues ?? 0}
                      </strong>
                    </ReportCardStat>
                    <ReportCardStat>
                      <span>Fuentes</span>
                      <strong>
                        {latestRun?.validationSummary.sourceSummaries.length ??
                          0}
                      </strong>
                    </ReportCardStat>
                  </ReportCardStats>

                  <ReportCardFooter>
                    <Button onClick={() => setActiveTab(reportCode)}>
                      Abrir reporte
                    </Button>
                    <Button
                      type="primary"
                      loading={running}
                      onClick={() => void handleRun(reportCode)}
                    >
                      Generar
                    </Button>
                  </ReportCardFooter>
                </ReportCard>
              );
            })}
          </ReportCardsGrid>
        </SummaryView>
      ),
    },
    {
      key: 'DGII_607',
      label: '607',
      children: renderReportWorkspace('DGII_607'),
    },
    {
      key: 'DGII_606',
      label: '606',
      children: renderReportWorkspace('DGII_606'),
    },
    {
      key: 'DGII_608',
      label: '608',
      children: renderReportWorkspace('DGII_608'),
    },
    {
      key: 'runs',
      label: 'Corridas e issues',
      children: (
        <RunsWorkspace>
          <SummaryStrip>
            <SummaryItem>
              <span>Corridas del periodo</span>
              <strong>{currentPeriodRuns.length}</strong>
            </SummaryItem>
            <SummaryItem $warning={totalIssuesAcrossPeriod > 0}>
              <span>Issues acumulados</span>
              <strong>{totalIssuesAcrossPeriod}</strong>
            </SummaryItem>
            <SummaryItem>
              <span>Reportes activos</span>
              <strong>
                {new Set(currentPeriodRuns.map((run) => run.reportCode)).size}
              </strong>
            </SummaryItem>
          </SummaryStrip>

          {!currentPeriodRuns.length ? (
            <EmptyStateCard>
              <strong>Sin corridas para este periodo.</strong>
              <span>
                Ejecuta 606, 607 o 608 para empezar a auditar issues y exportar
                artefactos.
              </span>
            </EmptyStateCard>
          ) : (
            <RunsGrid>
              <RunsList>
                {currentPeriodRuns.map((run) => (
                  <RunItemButton
                    key={run.id}
                    type="button"
                    $selected={run.id === selectedOverviewRun?.id}
                    $tone={resolveMonthlyComplianceStatusTone(run.status)}
                    onClick={() => setSelectedOverviewRunId(run.id)}
                  >
                    <RunItemTop>
                      <strong>
                        {REPORT_LABELS[run.reportCode]} · v{run.version}
                      </strong>
                      <StatusTag $tone={getStatusTone(run.status)}>
                        {resolveMonthlyComplianceStatusLabel(run.status)}
                      </StatusTag>
                    </RunItemTop>
                    <span>{formatMonthlyComplianceRunDate(run.createdAt)}</span>
                    <span>{run.validationSummary.totalIssues} issues</span>
                  </RunItemButton>
                ))}
              </RunsList>

              <RunDetails>
                {selectedOverviewRun ? (
                  <SelectedRunDetails run={selectedOverviewRun} />
                ) : (
                  <EmptyText>
                    Selecciona una corrida para ver detalle.
                  </EmptyText>
                )}
              </RunDetails>
            </RunsGrid>
          )}
        </RunsWorkspace>
      ),
    },
  ];

  return (
    <Panel>
      <SectionHeader>
        <div>
          <SectionTitle>Cumplimiento fiscal</SectionTitle>
          <SectionDescription>
            Corre, valida y exporta 606, 607 y 608.
          </SectionDescription>
        </div>

        <Toolbar>
          <PeriodSelect
            size="middle"
            value={effectivePeriodKey}
            options={periodOptions}
            onChange={setRequestedPeriodKey}
          />
          {isReportTab(activeTab) ? (
            <>
              <Button
                type="primary"
                loading={running}
                onClick={() => void handleRun(activeTab)}
              >
                Generar {REPORT_LABELS[activeTab]}
              </Button>
              {activeTab === 'DGII_607' || activeTab === 'DGII_608' ? (
                <Button
                  icon={<DownloadOutlined />}
                  loading={exportingReportCode === activeTab}
                  onClick={() => void handleExportTxt(activeTab)}
                >
                  Exportar TXT
                </Button>
              ) : null}
            </>
          ) : null}
        </Toolbar>
      </SectionHeader>

      {error ? (
        <Alert
          type="error"
          showIcon
          message="No se pudieron cargar las corridas de cumplimiento fiscal."
          description={error}
        />
      ) : null}

      <StyledTabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) => setActiveTab(key as FiscalComplianceTabKey)}
      />
    </Panel>
  );
};

const SelectedRunDetails = ({ run }: { run: MonthlyComplianceRun }) => {
  const sourceSnapshots = run.sourceSnapshot.sourceSnapshots;
  const visibleIssues = useMemo(
    () => groupFiscalIssues(run.issues).slice(0, 8),
    [run.issues],
  );

  return (
    <>
      <DetailHeader>
        <div>
          <DetailTitle>
            DGII {REPORT_LABELS[run.reportCode]} ·{' '}
            {formatAccountingPeriod(run.periodKey)}
          </DetailTitle>
          <SectionDescription>
            Creado {formatMonthlyComplianceRunDate(run.createdAt)}
          </SectionDescription>
        </div>
        <StatusTag $tone={getStatusTone(run.status)}>
          {resolveMonthlyComplianceStatusLabel(run.status)}
        </StatusTag>
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
            <span>{translateSourceId(summary.sourceId)}</span>
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
          <DetailTitle>Issues</DetailTitle>
          <strong>{run.validationSummary.totalIssues}</strong>
        </IssueHeader>
        {!visibleIssues.length ? (
          <EmptyText>Sin issues para esta corrida.</EmptyText>
        ) : (
          <IssueList>
            {visibleIssues.map((issue, index) => (
              <IssueItem key={`${run.id}-issue-${issue.key}-${index}`}>
                <IssueTop>
                  <Tag color={issue.severity === 'error' ? 'error' : 'warning'}>
                    {translateSeverity(issue.severity)}
                  </Tag>
                  <strong>{translateIssueCode(issue.code)}</strong>
                </IssueTop>
                <IssueDetail>
                  <IssueDetailChip>{translateSourceId(issue.sourceId)}</IssueDetailChip>
                  <span>·</span>
                  <IssueDocNumber>
                    Comprobante #{issue.documentNumber}
                  </IssueDocNumber>
                </IssueDetail>
                {issue.fields.length ? (
                  <IssueFieldList>
                    {issue.fields.map((field) => (
                      <li key={`${issue.key}-${field}`}>{field}</li>
                    ))}
                  </IssueFieldList>
                ) : null}
              </IssueItem>
            ))}
          </IssueList>
        )}
      </IssueSection>
    </>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-6) 0 var(--ds-space-8);
`;

const SectionHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const DetailTitle = styled.h3`
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

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3);
`;

const PeriodSelect = styled(Select)`
  width: 196px;
  min-width: 196px;
  flex: 0 0 auto;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: var(--ds-space-4);
  }

  .ant-tabs-tab {
    padding: var(--ds-space-2) var(--ds-space-1);
  }

  .ant-tabs-content-holder {
    min-height: 0;
  }
`;

const StatusTag = styled(Tag)<{
  $tone: 'success' | 'warning' | 'neutral';
}>`
  && {
    border-radius: var(--ds-radius-pill);
    padding-inline: 10px;
    font-weight: var(--ds-font-weight-medium);
    margin-inline-end: 0;

    ${({ $tone }) =>
      $tone === 'success'
        ? `
      background: #dcfce7;
      border: 1px solid #86efac;
      color: #166534;
    `
        : $tone === 'warning'
          ? `
      background: var(--ds-color-state-warning-subtle);
      border: 1px solid var(--ds-color-state-warning);
      color: var(--ds-color-state-warning-text);
    `
          : `
      background: var(--ds-color-bg-surface-hover);
      border: 1px solid var(--ds-color-border-subtle);
      color: var(--ds-color-text-secondary);
    `}
  }
`;

const SummaryView = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
`;

const ReportWorkspace = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
`;

const RunsWorkspace = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
`;

const ReportLead = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const ReportLeadText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
`;

const ReportLeadTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const ActionCluster = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: flex-start;
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

  strong {
    font-size: var(--ds-font-size-lg);
    line-height: var(--ds-line-height-tight);
    color: var(--ds-color-text-primary);
    font-variant-numeric: tabular-nums;
  }
`;

const ReportCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const ReportCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const ReportCardTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-3);
  align-items: flex-start;
`;

const ReportCardTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const ReportCardDescription = styled.p`
  margin: var(--ds-space-1) 0 0;
  color: var(--ds-color-text-secondary);
`;

const ReportCardStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-2);
`;

const ReportCardStat = styled.div<{ $warning?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--ds-space-3);
  border-radius: var(--ds-radius-md);
  background: ${({ $warning }) =>
    $warning
      ? 'var(--ds-color-state-warning-subtle)'
      : 'var(--ds-color-bg-surface-hover)'};

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
    text-transform: uppercase;
  }

  strong {
    font-variant-numeric: tabular-nums;
    color: var(--ds-color-text-primary);
  }
`;

const ReportCardFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
`;

const EmptyText = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
`;

const EmptyStateCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-5);
  border: 1px dashed var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);

  strong {
    color: var(--ds-color-text-primary);
  }

  span {
    color: var(--ds-color-text-secondary);
  }
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
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
  overflow: hidden;
`;

const RunItemButton = styled.button<{
  $selected: boolean;
  $tone: 'success' | 'warning' | 'neutral';
}>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  align-items: flex-start;
  width: 100%;
  padding: var(--ds-space-3) var(--ds-space-4);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border-subtle);
  background: ${({ $selected }) =>
    $selected
      ? 'var(--ds-color-action-primary-subtle)'
      : 'rgba(17, 24, 39, 0.02)'};
  color: inherit;
  cursor: pointer;
  position: relative;
  z-index: ${({ $selected }) => ($selected ? 1 : 0)};
  transition:
    background-color 0.16s ease,
    box-shadow 0.16s ease;
  border-color: var(--ds-color-border-subtle);
  box-shadow: none;

  &:hover {
    background: ${({ $selected }) =>
      $selected
        ? 'var(--ds-color-action-primary-subtle)'
        : 'rgba(17, 24, 39, 0.06)'};
    box-shadow: none;
  }

  span {
    color: var(--ds-color-text-secondary);
    text-align: left;
  }

  strong {
    color: ${({ $selected }) =>
      $selected
        ? 'var(--ds-color-action-primary)'
        : 'var(--ds-color-text-primary)'};
  }

  &:last-child {
    border-bottom: 0;
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

const IssueDetail = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  flex-wrap: wrap;

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }
`;

const IssueDetailChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: var(--ds-radius-pill);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-subtle);
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
  white-space: nowrap;
`;

const IssueDocNumber = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-disabled);
`;

const IssueFieldList = styled.ul`
  margin: 0;
  padding-left: var(--ds-space-4);
  display: flex;
  flex-direction: column;
  gap: 2px;

  li {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }
`;
