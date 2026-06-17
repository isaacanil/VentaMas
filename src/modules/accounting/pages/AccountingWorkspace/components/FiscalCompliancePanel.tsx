import { DownloadOutlined, HistoryOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  VmAlert,
  VmButton,
  VmCard,
  VmChip,
  VmModal,
  VmTable,
} from '@/components/heroui';
import { fbExportDgiiTxtReport } from '@/firebase/accounting/fbExportDgiiTxtReport';
import {
  fbRunMonthlyComplianceReport,
  type MonthlyComplianceReportCode,
} from '@/firebase/accounting/fbRunMonthlyComplianceReport';
import { downloadTextFile } from '@/utils/export/download';

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
import {
  buildFiscalDate,
  formatFiscalDate,
  getDaysUntil,
  getFiscalCalendarItems,
} from './utils/fiscalComplianceCalendar';
import {
  formatCurrency,
  formatMoney,
  formatShortDate,
  getDgii606ExcludedRows,
  getDgii606ItbisTotal,
  getDgii606Rows,
  getDgii607ExcludedRows,
  getDgii607Rows,
  getDgii608Rows,
  getRunRecordCount,
  resolveDgiiDocumentType,
  resolveExcludedReason,
  toPreviewText,
} from './utils/fiscalCompliancePreview';

interface FiscalCompliancePanelProps {
  businessId: string | null;
  enabled: boolean;
  monthlyComplianceAvailable: boolean;
  monthlyComplianceError: string | null;
  monthlyComplianceResolved: boolean;
  periods: string[];
  defaultPeriodKey: string | null;
}

type FiscalComplianceTabKey = MonthlyComplianceReportCode;

const REPORT_CODES: MonthlyComplianceReportCode[] = [
  'DGII_606',
  'DGII_607',
  'DGII_608',
];

const REPORT_LABELS: Record<MonthlyComplianceReportCode, string> = {
  DGII_606: '606',
  DGII_607: '607',
  DGII_608: '608',
};

const getStatusTone = (status: string) =>
  resolveMonthlyComplianceStatusTone(status);

type VmChipColor = 'default' | 'accent' | 'danger' | 'success' | 'warning';

const getStatusChipColor = (status: string): VmChipColor => {
  const tone = getStatusTone(status);
  return tone === 'neutral' ? 'default' : tone;
};

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
    const issueKey = [
      severity,
      code,
      sourceId,
      documentNumber,
      recordId ?? '',
    ].join('|');
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
      fields: new Set(fieldPath ? [translateFieldPath(fieldPath)] : []),
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

export const FiscalCompliancePanel = ({
  businessId,
  enabled,
  monthlyComplianceAvailable,
  monthlyComplianceError,
  monthlyComplianceResolved,
  periods,
  defaultPeriodKey,
}: FiscalCompliancePanelProps) => {
  const [activeTab, setActiveTab] =
    useState<FiscalComplianceTabKey>('DGII_606');
  const [requestedPeriodKey, setRequestedPeriodKey] = useState('');
  const [selectedRunIds, setSelectedRunIds] = useState<
    Partial<Record<MonthlyComplianceReportCode, string | null>>
  >({});
  const [selectedOverviewRunId, setSelectedOverviewRunId] = useState<
    string | null
  >(null);
  const [runsModalOpen, setRunsModalOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [exportingReportCode, setExportingReportCode] =
    useState<MonthlyComplianceReportCode | null>(null);

  const effectivePeriodKey =
    requestedPeriodKey ||
    defaultPeriodKey ||
    buildMonthlyComplianceDefaultPeriodKey();
  const {
    error,
    periodKeys: runPeriodKeys,
    runs,
  } = useMonthlyComplianceRuns({
    businessId,
    enabled,
    periodKey: effectivePeriodKey,
  });
  const periodOptions = useMemo(() => {
    const uniquePeriods = Array.from(
      new Set(
        [effectivePeriodKey, ...periods, ...runPeriodKeys].filter(Boolean),
      ),
    );

    return uniquePeriods.map((period) => ({
      label: formatAccountingPeriod(period),
      value: period,
    }));
  }, [effectivePeriodKey, periods, runPeriodKeys]);

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
    selectedOverviewRunId !== null
      ? (currentPeriodRuns.find((run) => run.id === selectedOverviewRunId) ??
        null)
      : (currentPeriodRuns[0] ?? null);

  const totalIssuesAcrossPeriod = currentPeriodRuns.reduce(
    (total, run) => total + run.validationSummary.totalIssues,
    0,
  );
  const latestRunByCode = useMemo(
    () =>
      REPORT_CODES.reduce(
        (accumulator, reportCode) => ({
          ...accumulator,
          [reportCode]: reportRunsByCode[reportCode][0] ?? null,
        }),
        {} as Record<MonthlyComplianceReportCode, MonthlyComplianceRun | null>,
      ),
    [reportRunsByCode],
  );
  const latest606Run = latestRunByCode.DGII_606;
  const fiscalCalendarItems = useMemo(
    () => getFiscalCalendarItems(effectivePeriodKey),
    [effectivePeriodKey],
  );
  const fiscalDueDate = buildFiscalDate(effectivePeriodKey, 1, 15);
  const itbisPaymentDate = buildFiscalDate(effectivePeriodKey, 1, 20);
  const recentHistoryRuns = runs.slice(0, 4);
  const monthlyComplianceActionsDisabled =
    !monthlyComplianceResolved || !monthlyComplianceAvailable;
  const monthlyComplianceUnavailableMessage =
    monthlyComplianceError ??
    'El piloto de compliance mensual DGII no esta habilitado para este negocio.';

  const resolveSelectedRunForReport = (
    reportCode: MonthlyComplianceReportCode,
  ) => {
    const reportRuns = reportRunsByCode[reportCode];
    const selectedRunId = selectedRunIds[reportCode];

    if (selectedRunId) {
      return reportRuns.find((run) => run.id === selectedRunId) ?? null;
    }

    return reportRuns[0] ?? null;
  };

  const handleRun = async (reportCode: MonthlyComplianceReportCode) => {
    if (!businessId) {
      message.error('No hay negocio activo para correr cumplimiento fiscal.');
      return;
    }
    if (!monthlyComplianceResolved) {
      message.info('Validando habilitacion de compliance mensual DGII.');
      return;
    }
    if (!monthlyComplianceAvailable) {
      message.error(monthlyComplianceUnavailableMessage);
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
      setSelectedRunIds((currentValue) => ({
        ...currentValue,
        [result.reportCode]: result.reportRunId,
      }));
      setSelectedOverviewRunId(result.reportRunId);
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
    if (!monthlyComplianceResolved) {
      void message.info('Validando habilitacion de compliance mensual DGII.');
      return;
    }
    if (!monthlyComplianceAvailable) {
      void message.error(monthlyComplianceUnavailableMessage);
      return;
    }

    const selectedRun = resolveSelectedRunForReport(reportCode);
    if (!selectedRun) {
      void message.error('Genera una corrida fiscal antes de exportar el TXT.');
      return;
    }

    setExportingReportCode(reportCode);
    try {
      const result = await fbExportDgiiTxtReport({
        businessId,
        periodKey: effectivePeriodKey,
        reportCode,
        reportRunId: selectedRun.id,
      });

      downloadTextFile({
        text: result.content,
        fileName: result.fileName,
      });

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
        {reportCode === 'DGII_606' && selectedRun ? (
          <Dgii606Preview run={selectedRun} />
        ) : null}
        {reportCode === 'DGII_607' && selectedRun ? (
          <Dgii607Preview run={selectedRun} />
        ) : null}
        {reportCode === 'DGII_608' && selectedRun ? (
          <Dgii608Preview run={selectedRun} />
        ) : null}

        {!reportRuns.length ? (
          <EmptyStateCard>
            <strong>Sin corridas para este reporte.</strong>
            <span>
              Genera un borrador {REPORT_LABELS[reportCode]} para{' '}
              {formatAccountingPeriod(effectivePeriodKey)} antes de exportar.
            </span>
          </EmptyStateCard>
        ) : null}
      </ReportWorkspace>
    );
  };

  const handleOpenRunsModal = () => {
    setSelectedOverviewRunId((currentValue) =>
      currentValue && currentPeriodRuns.some((run) => run.id === currentValue)
        ? currentValue
        : (currentPeriodRuns[0]?.id ?? null),
    );
    setRunsModalOpen(true);
  };

  const handleRunsModalOpenChange = useCallback((open: boolean) => {
    setRunsModalOpen((currentValue) =>
      currentValue === open ? currentValue : open,
    );
  }, []);

  const handleSelectOverviewRun = (run: MonthlyComplianceRun) => {
    setSelectedOverviewRunId(run.id);
    setSelectedRunIds((currentValue) => ({
      ...currentValue,
      [run.reportCode]: run.id,
    }));
    setActiveTab(run.reportCode);
  };

  const renderRunsWorkspace = () => (
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
                onClick={() => handleSelectOverviewRun(run)}
              >
                <RunItemTop>
                  <strong>
                    {REPORT_LABELS[run.reportCode]} · v{run.version}
                  </strong>
                  <VmChip
                    className="w-fit"
                    color={getStatusChipColor(run.status)}
                    variant="soft"
                  >
                    <VmChip.Label>
                      {resolveMonthlyComplianceStatusLabel(run.status)}
                    </VmChip.Label>
                  </VmChip>
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
              <EmptyText>Selecciona una corrida para ver detalle.</EmptyText>
            )}
          </RunDetails>
        </RunsGrid>
      )}
    </RunsWorkspace>
  );

  return (
    <Panel>
      <SectionHeader>
        <div>
          <SectionTitle>Cumplimiento legal DGII</SectionTitle>
          <SectionDescription>
            Formatos 606, 607, 608 · periodo fiscal{' '}
            <strong>{formatAccountingPeriod(effectivePeriodKey)}</strong> ·
            vence el {formatFiscalDate(fiscalDueDate)}
          </SectionDescription>
        </div>

        <Toolbar>
          <ToolbarSelect
            aria-label="Periodo fiscal"
            value={effectivePeriodKey}
            onChange={(event) => {
              setRequestedPeriodKey(event.target.value);
            }}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </ToolbarSelect>

          <ToolbarSelect
            aria-label="Tipo de reporte"
            value={activeTab}
            onChange={(event) => {
              setActiveTab(event.target.value as FiscalComplianceTabKey);
            }}
          >
            {REPORT_CODES.map((reportCode) => (
              <option key={reportCode} value={reportCode}>
                DGII {REPORT_LABELS[reportCode]}
              </option>
            ))}
          </ToolbarSelect>

          <VmButton
            size="sm"
            variant="primary"
            isDisabled={monthlyComplianceActionsDisabled}
            isPending={running}
            onPress={() => void handleRun(activeTab)}
          >
            Generar {REPORT_LABELS[activeTab]}
          </VmButton>
          <VmButton
            size="sm"
            variant="secondary"
            isDisabled={
              monthlyComplianceActionsDisabled ||
              !resolveSelectedRunForReport(activeTab)
            }
            isPending={exportingReportCode === activeTab}
            onPress={() => void handleExportTxt(activeTab)}
          >
            <DownloadOutlined />
            Exportar TXT
          </VmButton>
          <VmButton
            isIconOnly
            aria-label="Ver corridas e issues"
            size="sm"
            variant="secondary"
            onPress={handleOpenRunsModal}
          >
            <HistoryOutlined />
          </VmButton>
        </Toolbar>
      </SectionHeader>

      <ExecutiveGrid>
        <ExecutiveCard>
          <VmCard.Header>
            <ExecutiveLabel>Total a pagar ITBIS</ExecutiveLabel>
          </VmCard.Header>
          <VmCard.Content>
            <ExecutiveValue>
              {formatCurrency(getDgii606ItbisTotal(latest606Run))}
            </ExecutiveValue>
            <ExecutiveMeta>
              Vence {formatFiscalDate(itbisPaymentDate)} · IT-1
            </ExecutiveMeta>
          </VmCard.Content>
        </ExecutiveCard>
        {REPORT_CODES.map((reportCode) => {
          const latestRun = latestRunByCode[reportCode];
          return (
            <ExecutiveCard key={reportCode}>
              <VmCard.Header>
                <ExecutiveLabel>
                  Registros {REPORT_LABELS[reportCode]}
                  {reportCode === 'DGII_608' ? ' (anulados)' : ''}
                </ExecutiveLabel>
              </VmCard.Header>
              <VmCard.Content>
                <ExecutiveValue>{getRunRecordCount(latestRun)}</ExecutiveValue>
                <VmChip
                  className="w-fit"
                  color={
                    !latestRun
                      ? 'default'
                      : latestRun.validationSummary.totalIssues
                        ? 'warning'
                        : 'success'
                  }
                  size="sm"
                  variant="soft"
                >
                  <VmChip.Label>
                    {latestRun
                      ? latestRun.validationSummary.totalIssues
                        ? `${latestRun.validationSummary.totalIssues} issues`
                        : 'Validado'
                      : 'Sin corrida'}
                  </VmChip.Label>
                </VmChip>
              </VmCard.Content>
            </ExecutiveCard>
          );
        })}
      </ExecutiveGrid>

      {error ? (
        <ComplianceAlert status="danger">
          <VmAlert.Content>
            <VmAlert.Title>
              No se pudieron cargar las corridas de cumplimiento fiscal.
            </VmAlert.Title>
            <VmAlert.Description>{error}</VmAlert.Description>
          </VmAlert.Content>
        </ComplianceAlert>
      ) : null}

      {!monthlyComplianceResolved ? (
        <ComplianceAlert status="accent">
          <VmAlert.Content>
            <VmAlert.Title>
              Validando habilitacion de compliance mensual DGII.
            </VmAlert.Title>
            <VmAlert.Description>
              Las acciones de generar y exportar se activaran cuando el estado
              fiscal del negocio este confirmado.
            </VmAlert.Description>
          </VmAlert.Content>
        </ComplianceAlert>
      ) : !monthlyComplianceAvailable ? (
        <ComplianceAlert status="warning">
          <VmAlert.Content>
            <VmAlert.Title>
              Compliance mensual DGII no habilitado.
            </VmAlert.Title>
            <VmAlert.Description>
              {monthlyComplianceUnavailableMessage}
            </VmAlert.Description>
          </VmAlert.Content>
        </ComplianceAlert>
      ) : null}

      <WorkspaceWrapper>{renderReportWorkspace(activeTab)}</WorkspaceWrapper>

      {runsModalOpen ? (
        <VmModal.Backdrop
          isOpen={runsModalOpen}
          onOpenChange={handleRunsModalOpenChange}
          className="z-[350]"
        >
          <VmModal.Container
            placement="top"
            scroll="inside"
            size="cover"
            className="max-w-[1040px] mt-4"
          >
            <VmModal.Dialog>
              <VmModal.Header>
                <VmModal.Heading>
                  Corridas e issues ·{' '}
                  {formatAccountingPeriod(effectivePeriodKey)}
                </VmModal.Heading>
                <VmModal.CloseTrigger />
              </VmModal.Header>
              <VmModal.Body>
                <ModalBody>{renderRunsWorkspace()}</ModalBody>
              </VmModal.Body>
            </VmModal.Dialog>
          </VmModal.Container>
        </VmModal.Backdrop>
      ) : null}

      <SupportGrid>
        <VmCard>
          <VmCard.Header>
            <DetailTitle>Calendario fiscal</DetailTitle>
          </VmCard.Header>
          <VmCard.Content>
            <NativeTableWrap>
              <NativeTable aria-label="Calendario fiscal">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Evento</th>
                    <th>Plazo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {fiscalCalendarItems.map((item) => {
                    const daysUntil = getDaysUntil(item.date);
                    return (
                      <tr key={`${item.label}-${formatFiscalDate(item.date)}`}>
                        <td>{formatFiscalDate(item.date)}</td>
                        <td>{item.label}</td>
                        <td>
                          {daysUntil >= 0 ? `en ${daysUntil} dias` : 'vencido'}
                        </td>
                        <td>
                          <StatusPill $tone={item.tone}>
                            {item.tone === 'warning' ? 'Proximo' : 'Programado'}
                          </StatusPill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </NativeTable>
            </NativeTableWrap>
          </VmCard.Content>
        </VmCard>

        <VmCard>
          <VmCard.Header>
            <DetailTitle>Historial de corridas DGII</DetailTitle>
          </VmCard.Header>
          <VmCard.Content>
            {!recentHistoryRuns.length ? (
              <EmptyText className="p-4">Sin corridas registradas.</EmptyText>
            ) : (
              <NativeTableWrap>
                <NativeTable aria-label="Historial de corridas DGII">
                  <thead>
                    <tr>
                      <th>Fecha corrida</th>
                      <th>Periodo / Reporte</th>
                      <th>Resultado</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentHistoryRuns.map((run) => (
                      <tr key={run.id}>
                        <td>{formatMonthlyComplianceRunDate(run.createdAt)}</td>
                        <td>
                          {formatAccountingPeriod(run.periodKey)}
                          <SmallMeta>
                            {REPORT_LABELS[run.reportCode]} v{run.version}
                          </SmallMeta>
                        </td>
                        <td>{run.validationSummary.totalIssues} issues</td>
                        <td>
                          <StatusPill
                            $tone={resolveMonthlyComplianceStatusTone(
                              run.status,
                            )}
                          >
                            {resolveMonthlyComplianceStatusLabel(run.status)}
                          </StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </NativeTable>
              </NativeTableWrap>
            )}
          </VmCard.Content>
        </VmCard>
      </SupportGrid>
    </Panel>
  );
};

const Dgii606Preview = ({ run }: { run: MonthlyComplianceRun }) => {
  const rows = useMemo(() => getDgii606Rows(run), [run]);
  const excludedRows = useMemo(() => getDgii606ExcludedRows(run), [run]);

  return (
    <PreviewPanel>
      <VmCard.Header>
        <PreviewHeader>
          <div>
            <DetailTitle>Detalle 606</DetailTitle>
            <SectionDescription>
              Compras y gastos normalizados para revisión legal del periodo.
            </SectionDescription>
          </div>
          <VmChip
            className="w-fit"
            color={getStatusChipColor(run.status)}
            variant="soft"
          >
            <VmChip.Label>
              {resolveMonthlyComplianceStatusLabel(run.status)}
            </VmChip.Label>
          </VmChip>
        </PreviewHeader>
      </VmCard.Header>
      <VmCard.Content>
        <VmTable>
          <VmTable.ScrollContainer>
            <VmTable.Content
              aria-label="Detalle 606"
              className="min-w-[1320px]"
            >
              <VmTable.Header>
                <VmTable.Column isRowHeader>Fuente</VmTable.Column>
                <VmTable.Column>Documento</VmTable.Column>
                <VmTable.Column>ID origen</VmTable.Column>
                <VmTable.Column>RNC proveedor</VmTable.Column>
                <VmTable.Column>Tipo gasto</VmTable.Column>
                <VmTable.Column>NCF</VmTable.Column>
                <VmTable.Column>Fecha</VmTable.Column>
                <VmTable.Column>Pago</VmTable.Column>
                <VmTable.Column>Forma pago</VmTable.Column>
                <VmTable.Column>Servicios</VmTable.Column>
                <VmTable.Column>Bienes</VmTable.Column>
                <VmTable.Column>Total</VmTable.Column>
                <VmTable.Column>ITBIS</VmTable.Column>
                <VmTable.Column>Estado</VmTable.Column>
              </VmTable.Header>
              <VmTable.Body
                items={rows}
                renderEmptyState={() => (
                  <EmptyStateCard>
                    <strong>Sin registros 606 visibles.</strong>
                    <span>
                      Genera una corrida nueva o revisa si el periodo tiene
                      compras y gastos registrados.
                    </span>
                  </EmptyStateCard>
                )}
              >
                {(row) => (
                  <VmTable.Row
                    id={`${row.sourceId}-${row.recordId ?? row.index}`}
                  >
                    <VmTable.Cell>
                      {translateSourceId(String(row.sourceId))}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.documentNumber)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.recordId)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.counterpartyIdentificationNumber)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.expenseType)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.documentFiscalNumber)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {formatShortDate(row.issuedAt)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {formatShortDate(row.paymentAt)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.paymentFormCode)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {formatMoney(row.serviceAmount)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {formatMoney(row.goodsAmount)}
                    </VmTable.Cell>
                    <VmTable.Cell>{formatMoney(row.total)}</VmTable.Cell>
                    <VmTable.Cell>
                      {formatMoney(row.itbisTotal)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      <VmChip color="default" size="sm" variant="soft">
                        <VmChip.Label>
                          {toPreviewText(row.status)}
                        </VmChip.Label>
                      </VmChip>
                    </VmTable.Cell>
                  </VmTable.Row>
                )}
              </VmTable.Body>
            </VmTable.Content>
          </VmTable.ScrollContainer>
        </VmTable>

        {excludedRows.length ? (
          <ExcludedRecordsTable
            rows={excludedRows}
            title="Registros leidos que no entran al 606"
          />
        ) : null}
      </VmCard.Content>
    </PreviewPanel>
  );
};

const Dgii607Preview = ({ run }: { run: MonthlyComplianceRun }) => {
  const rows = useMemo(() => getDgii607Rows(run), [run]);
  const excludedRows = useMemo(() => getDgii607ExcludedRows(run), [run]);

  return (
    <PreviewPanel>
      <VmCard.Header>
        <PreviewHeader>
          <div>
            <DetailTitle>Detalle 607</DetailTitle>
            <SectionDescription>
              Ventas con NCF tipo B01 (credito fiscal) y B02 (consumidor final,
              agrupable).
            </SectionDescription>
          </div>
          <VmChip
            className="w-fit"
            color={getStatusChipColor(run.status)}
            variant="soft"
          >
            <VmChip.Label>
              {resolveMonthlyComplianceStatusLabel(run.status)}
            </VmChip.Label>
          </VmChip>
        </PreviewHeader>
      </VmCard.Header>
      <VmCard.Content>
        <VmTable>
          <VmTable.ScrollContainer>
            <VmTable.Content
              aria-label="Detalle 607"
              className="min-w-[1680px]"
            >
              <VmTable.Header>
                <VmTable.Column isRowHeader>RNC cliente</VmTable.Column>
                <VmTable.Column>Fuente</VmTable.Column>
                <VmTable.Column>Documento</VmTable.Column>
                <VmTable.Column>NCF</VmTable.Column>
                <VmTable.Column>Tipo</VmTable.Column>
                <VmTable.Column>Fecha</VmTable.Column>
                <VmTable.Column>Total</VmTable.Column>
                <VmTable.Column>ITBIS</VmTable.Column>
                <VmTable.Column>ITBIS retenido</VmTable.Column>
                <VmTable.Column>ISR retenido</VmTable.Column>
                <VmTable.Column>Efectivo</VmTable.Column>
                <VmTable.Column>Cheque/Tr.</VmTable.Column>
                <VmTable.Column>Tarjeta</VmTable.Column>
                <VmTable.Column>Crédito</VmTable.Column>
                <VmTable.Column>Factura ref.</VmTable.Column>
                <VmTable.Column>Estado</VmTable.Column>
              </VmTable.Header>
              <VmTable.Body
                items={rows}
                renderEmptyState={() => (
                  <EmptyStateCard>
                    <strong>Sin registros 607 visibles.</strong>
                    <span>
                      No hay ventas con NCF B01/B02 en la corrida activa. Las
                      facturas sin comprobante fiscal no entran al 607.
                    </span>
                  </EmptyStateCard>
                )}
              >
                {(row) => (
                  <VmTable.Row
                    id={`${row.sourceId}-${row.recordId ?? row.index}`}
                  >
                    <VmTable.Cell>
                      {toPreviewText(row.counterpartyIdentificationNumber)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {translateSourceId(String(row.sourceId))}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.documentNumber)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.documentFiscalNumber)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {resolveDgiiDocumentType(row.documentFiscalNumber)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {formatShortDate(row.retentionDate ?? row.issuedAt)}
                    </VmTable.Cell>
                    <VmTable.Cell>{formatMoney(row.total)}</VmTable.Cell>
                    <VmTable.Cell>
                      {formatMoney(row.itbisTotal)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {formatMoney(row.itbisWithheld)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {formatMoney(row.incomeTaxWithheld)}
                    </VmTable.Cell>
                    <VmTable.Cell>{formatMoney(row.cash)}</VmTable.Cell>
                    <VmTable.Cell>
                      {formatMoney(row.checkTransfer)}
                    </VmTable.Cell>
                    <VmTable.Cell>{formatMoney(row.card)}</VmTable.Cell>
                    <VmTable.Cell>
                      {formatMoney(row.creditSale)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.invoiceId ?? row.invoiceNcf)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      <VmChip color="default" size="sm" variant="soft">
                        <VmChip.Label>
                          {toPreviewText(row.status)}
                        </VmChip.Label>
                      </VmChip>
                    </VmTable.Cell>
                  </VmTable.Row>
                )}
              </VmTable.Body>
            </VmTable.Content>
          </VmTable.ScrollContainer>
        </VmTable>

        {excludedRows.length ? (
          <ExcludedRecordsTable
            rows={excludedRows}
            title="Registros leidos que no entran al 607"
          />
        ) : null}
      </VmCard.Content>
    </PreviewPanel>
  );
};

const Dgii608Preview = ({ run }: { run: MonthlyComplianceRun }) => {
  const rows = useMemo(() => getDgii608Rows(run), [run]);

  return (
    <PreviewPanel>
      <VmCard.Header>
        <PreviewHeader>
          <div>
            <DetailTitle>Detalle 608</DetailTitle>
            <SectionDescription>
              NCF anulados. Razon: 01 Deterioro - 02 Errores impresion - 03
              Impresion defectuosa - 04 Correccion informacion - 05 Cambio
              productos - 06 Devolucion productos - 07 Omision productos - 08
              Secuencia NCF - 09 Cese operaciones - 10 Perdida o hurto.
            </SectionDescription>
          </div>
          <VmChip
            className="w-fit"
            color={getStatusChipColor(run.status)}
            variant="soft"
          >
            <VmChip.Label>
              {resolveMonthlyComplianceStatusLabel(run.status)}
            </VmChip.Label>
          </VmChip>
        </PreviewHeader>
      </VmCard.Header>
      <VmCard.Content>
        <VmTable>
          <VmTable.ScrollContainer>
            <VmTable.Content
              aria-label="Detalle 608"
              className="min-w-[1040px]"
            >
              <VmTable.Header>
                <VmTable.Column isRowHeader>Fuente</VmTable.Column>
                <VmTable.Column>Documento</VmTable.Column>
                <VmTable.Column>NCF anulado</VmTable.Column>
                <VmTable.Column>Fecha</VmTable.Column>
                <VmTable.Column>Razon</VmTable.Column>
                <VmTable.Column>Descripcion</VmTable.Column>
                <VmTable.Column>Factura ref.</VmTable.Column>
                <VmTable.Column>ID origen</VmTable.Column>
                <VmTable.Column>Estado</VmTable.Column>
              </VmTable.Header>
              <VmTable.Body
                items={rows}
                renderEmptyState={() => (
                  <EmptyStateCard>
                    <strong>Sin registros 608 visibles.</strong>
                    <span>
                      Genera una corrida nueva o revisa si el periodo tiene
                      comprobantes anulados.
                    </span>
                  </EmptyStateCard>
                )}
              >
                {(row) => (
                  <VmTable.Row
                    id={`${row.sourceId}-${row.recordId ?? row.index}`}
                  >
                    <VmTable.Cell>
                      {translateSourceId(String(row.sourceId))}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.documentNumber)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.documentFiscalNumber)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {formatShortDate(row.issuedAt)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.reasonCode)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.reasonLabel ?? row.reason)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.invoiceId)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      {toPreviewText(row.recordId)}
                    </VmTable.Cell>
                    <VmTable.Cell>
                      <VmChip color="default" size="sm" variant="soft">
                        <VmChip.Label>
                          {toPreviewText(row.status) === '-'
                            ? 'Registrado'
                            : toPreviewText(row.status)}
                        </VmChip.Label>
                      </VmChip>
                    </VmTable.Cell>
                  </VmTable.Row>
                )}
              </VmTable.Body>
            </VmTable.Content>
          </VmTable.ScrollContainer>
        </VmTable>
      </VmCard.Content>
    </PreviewPanel>
  );
};

const ExcludedRecordsTable = ({
  rows,
  title,
}: {
  rows: Record<string, unknown>[];
  title: string;
}) => (
  <ExcludedPanel>
    <ExcludedTitle>{title}</ExcludedTitle>
    <VmTable>
      <VmTable.ScrollContainer>
        <VmTable.Content aria-label={title} className="min-w-[1040px]">
          <VmTable.Header>
            <VmTable.Column isRowHeader>Fuente</VmTable.Column>
            <VmTable.Column>Documento</VmTable.Column>
            <VmTable.Column>ID origen</VmTable.Column>
            <VmTable.Column>NCF</VmTable.Column>
            <VmTable.Column>Fecha</VmTable.Column>
            <VmTable.Column>Total</VmTable.Column>
            <VmTable.Column>ITBIS</VmTable.Column>
            <VmTable.Column>Estado</VmTable.Column>
            <VmTable.Column>Motivo</VmTable.Column>
          </VmTable.Header>
          <VmTable.Body items={rows}>
            {(row) => (
              <VmTable.Row
                id={`${row.sourceId}-${row.recordId ?? row.index}`}
              >
                <VmTable.Cell>
                  {translateSourceId(String(row.sourceId))}
                </VmTable.Cell>
                <VmTable.Cell>
                  {toPreviewText(row.documentNumber)}
                </VmTable.Cell>
                <VmTable.Cell>{toPreviewText(row.recordId)}</VmTable.Cell>
                <VmTable.Cell>
                  {toPreviewText(row.documentFiscalNumber)}
                </VmTable.Cell>
                <VmTable.Cell>
                  {formatShortDate(row.retentionDate ?? row.issuedAt)}
                </VmTable.Cell>
                <VmTable.Cell>{formatMoney(row.total)}</VmTable.Cell>
                <VmTable.Cell>{formatMoney(row.itbisTotal)}</VmTable.Cell>
                <VmTable.Cell>
                  <VmChip color="default" size="sm" variant="soft">
                    <VmChip.Label>{toPreviewText(row.status)}</VmChip.Label>
                  </VmChip>
                </VmTable.Cell>
                <VmTable.Cell>{resolveExcludedReason(row)}</VmTable.Cell>
              </VmTable.Row>
            )}
          </VmTable.Body>
        </VmTable.Content>
      </VmTable.ScrollContainer>
    </VmTable>
  </ExcludedPanel>
);

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
        <VmChip
          className="w-fit"
          color={getStatusChipColor(run.status)}
          variant="soft"
        >
          <VmChip.Label>
            {resolveMonthlyComplianceStatusLabel(run.status)}
          </VmChip.Label>
        </VmChip>
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
        <ComplianceAlert status="warning">
          <VmAlert.Content>
            <VmAlert.Title>Huecos pendientes del builder</VmAlert.Title>
            <VmAlert.Description>
              <GapList>
                {run.validationSummary.pendingGaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </GapList>
            </VmAlert.Description>
          </VmAlert.Content>
        </ComplianceAlert>
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
            {visibleIssues.map((issue) => (
              <IssueItem
                key={`${run.id}-issue-${issue.key}-${issue.sourceId}-${issue.documentNumber}-${issue.fields.join('|')}`}
              >
                <IssueTop>
                  <IssueSeverityChip
                    color={issue.severity === 'error' ? 'danger' : 'warning'}
                    size="sm"
                    variant="soft"
                  >
                    <VmChip.Label>
                      {translateSeverity(issue.severity)}
                    </VmChip.Label>
                  </IssueSeverityChip>
                  <strong>{translateIssueCode(issue.code)}</strong>
                </IssueTop>
                <IssueDetail>
                  <IssueDetailChip>
                    {translateSourceId(issue.sourceId)}
                  </IssueDetailChip>
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

const ToolbarSelect = styled.select`
  flex: 0 0 auto;
  min-width: 140px;
  height: 36px;
  padding: 0 var(--ds-space-7) 0 var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-surface);
  font-size: var(--ds-font-size-sm);
  outline: none;

  &:first-of-type {
    width: 196px;
    min-width: 196px;
  }

  &:focus {
    border-color: var(--ds-color-accent);
    box-shadow: 0 0 0 2px var(--ds-color-accent-subtle);
  }
`;

const WorkspaceWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  margin-top: var(--ds-space-2);
`;

const ComplianceAlert = styled(VmAlert)`
  .alert__title {
    font-weight: var(--ds-font-weight-semibold);
  }

  .alert__description {
    color: var(--ds-color-text-secondary);
  }
`;

const IssueSeverityChip = styled(VmChip)`
  font-weight: var(--ds-font-weight-semibold);
  text-transform: uppercase;
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

const ExecutiveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ExecutiveCard = styled(VmCard)`
  min-width: 0;

  .card__header {
    padding: 0;
  }

  .card__content {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-2);
    padding: 0;
  }
`;

const ExecutiveLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
`;

const ExecutiveValue = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xl);
  line-height: var(--ds-line-height-tight);
  font-variant-numeric: tabular-nums;
`;

const ExecutiveMeta = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const SupportGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-4);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const NativeTableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-lg);
`;

const NativeTable = styled.table`
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-primary);

  th,
  td {
    padding: var(--ds-space-3) var(--ds-space-4);
    text-align: left;
    border-top: 1px solid var(--ds-color-border-subtle);
  }

  th {
    border-top: 0;
    color: var(--ds-color-text-secondary);
    background: var(--ds-color-bg-subtle);
    font-weight: var(--ds-font-weight-semibold);
  }
`;

const StatusPill = styled.span<{ $tone?: string }>`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 2px 8px;
  border-radius: var(--ds-radius-full);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: ${({ $tone }) =>
    $tone === 'warning'
      ? 'var(--ds-color-state-warning-text)'
      : 'var(--ds-color-state-success-text)'};
  background: ${({ $tone }) =>
    $tone === 'warning'
      ? 'var(--ds-color-state-warning-subtle)'
      : 'var(--ds-color-state-success-subtle)'};
`;

const SmallMeta = styled.span`
  display: block;
  margin-top: 2px;
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const PreviewPanel = styled(VmCard)`
  .card__header {
    padding: 0;
  }

  .card__content {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-3);
    padding: 0;
  }
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-3);
  align-items: flex-start;
`;

const ExcludedPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-2);
`;

const ExcludedTitle = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-tight);
`;

const ModalBody = styled.div`
  padding-top: var(--ds-space-2);
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
