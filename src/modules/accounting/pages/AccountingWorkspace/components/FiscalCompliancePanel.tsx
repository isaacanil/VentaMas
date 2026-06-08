import {
  DownloadOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import {
  Alert as HeroAlert,
  Button as HeroButton,
  Card as HeroCard,
  Chip as HeroChip,
  Modal as HeroModal,
  Table as HeroTable,
} from '@heroui/react';
import { message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
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

type HeroChipColor = 'default' | 'accent' | 'danger' | 'success' | 'warning';

const getStatusChipColor = (status: string): HeroChipColor => {
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

type FiscalSourceRow = Record<string, unknown> & {
  sourceId: string;
  index: number;
};

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

const formatMoney = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '-';
};

const formatCurrency = (value: unknown) => `RD$ ${formatMoney(value)}`;

const padDatePart = (value: number) => String(value).padStart(2, '0');

const formatShortDate = (value: unknown) => {
  if (typeof value !== 'string' || !value.length) return '-';
  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!isoDateMatch) return '-';
  const [, year, month, day] = isoDateMatch;
  return `${day}/${month}/${year}`;
};

const toPreviewText = (value: unknown) =>
  typeof value === 'string' && value.trim().length ? value.trim() : '-';

const hasPreviewValue = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0;

const toSourceRows = (
  sourceRecords: Record<string, unknown>,
  sourceId: string,
): FiscalSourceRow[] => {
  const records = Array.isArray(sourceRecords[sourceId])
    ? sourceRecords[sourceId]
    : [];

  return records.map((record, index) => ({
    ...(record && typeof record === 'object'
      ? (record as Record<string, unknown>)
      : {}),
    sourceId,
    index,
  }));
};

const getDgii606ExcludedRows = (run: MonthlyComplianceRun) => {
  const sourceRecords = run.sourceSnapshot.sourceRecords;
  return [
    ...toSourceRows(sourceRecords, 'excludedPurchases'),
    ...toSourceRows(sourceRecords, 'excludedExpenses'),
    ...toSourceRows(sourceRecords, 'excludedAccountsPayablePayments'),
  ].sort((left, right) =>
    String(left.issuedAt ?? '').localeCompare(String(right.issuedAt ?? '')),
  );
};

const getDgii606Rows = (run: MonthlyComplianceRun) => {
  const sourceRecords = run.sourceSnapshot.sourceRecords;
  return [
    ...toSourceRows(sourceRecords, 'purchases'),
    ...toSourceRows(sourceRecords, 'expenses'),
  ].sort((left, right) =>
    String(left.issuedAt ?? '').localeCompare(String(right.issuedAt ?? '')),
  );
};

const getDgii607Rows = (run: MonthlyComplianceRun) => {
  const sourceRecords = run.sourceSnapshot.sourceRecords;
  return [
    ...toSourceRows(sourceRecords, 'invoices'),
    ...toSourceRows(sourceRecords, 'thirdPartyWithholdings'),
    ...toSourceRows(sourceRecords, 'creditNotes'),
  ]
    .filter((row) => hasPreviewValue(row.documentFiscalNumber))
    .sort((left, right) =>
      String(left.retentionDate ?? left.issuedAt ?? '').localeCompare(
        String(right.retentionDate ?? right.issuedAt ?? ''),
      ),
    );
};

const getDgii607ExcludedRows = (run: MonthlyComplianceRun) => {
  const sourceRecords = run.sourceSnapshot.sourceRecords;
  return [
    ...toSourceRows(sourceRecords, 'excludedInvoices'),
    ...toSourceRows(sourceRecords, 'excludedThirdPartyWithholdings'),
    ...toSourceRows(sourceRecords, 'excludedCreditNotes'),
  ].sort((left, right) =>
    String(left.retentionDate ?? left.issuedAt ?? '').localeCompare(
      String(right.retentionDate ?? right.issuedAt ?? ''),
    ),
  );
};

const getDgii608Rows = (run: MonthlyComplianceRun) => {
  const sourceRecords = run.sourceSnapshot.sourceRecords;
  return [
    ...toSourceRows(sourceRecords, 'invoices'),
    ...toSourceRows(sourceRecords, 'creditNotes'),
  ].sort((left, right) =>
    String(left.issuedAt ?? '').localeCompare(String(right.issuedAt ?? '')),
  );
};

const resolveDgiiDocumentType = (documentFiscalNumber: unknown) => {
  const ncf = toPreviewText(documentFiscalNumber).toUpperCase();
  if (ncf.startsWith('B01')) return '01';
  if (ncf.startsWith('B02')) return '02';
  if (ncf.startsWith('B04')) return '04';
  return '-';
};

const resolveExcludedReason = (row: Record<string, unknown>) => {
  if (!hasPreviewValue(row.documentFiscalNumber)) return 'Sin NCF';
  return 'Fuera del reporte';
};

const getRunRecordCount = (run: MonthlyComplianceRun | null) => {
  if (!run) return 0;
  if (run.reportCode === 'DGII_606') return getDgii606Rows(run).length;
  if (run.reportCode === 'DGII_607') return getDgii607Rows(run).length;
  if (run.reportCode === 'DGII_608') return getDgii608Rows(run).length;

  return run.validationSummary.sourceSummaries.reduce(
    (total, source) => total + source.recordsScanned,
    0,
  );
};

const getDgii606ItbisTotal = (run: MonthlyComplianceRun | null) =>
  run
    ? getDgii606Rows(run).reduce((total, row) => {
        const parsed = Number(row.itbisTotal);
        return Number.isFinite(parsed) ? total + parsed : total;
      }, 0)
    : 0;

const parsePeriodStart = (periodKey: string) => {
  const [year, month] = periodKey.split('-').map(Number);
  if (!year || !month) return new Date();
  return new Date(year, month - 1, 1);
};

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, date.getDate());

const buildFiscalDate = (
  periodKey: string,
  monthOffset: number,
  day: number,
) => {
  const periodStart = parsePeriodStart(periodKey);
  return new Date(
    periodStart.getFullYear(),
    periodStart.getMonth() + monthOffset,
    day,
  );
};

const formatFiscalDate = (date: Date) =>
  [
    padDatePart(date.getDate()),
    padDatePart(date.getMonth() + 1),
    date.getFullYear(),
  ].join('/');

const getDaysUntil = (date: Date) => {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const targetStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  return Math.ceil(
    (targetStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000),
  );
};

const getFiscalCalendarItems = (periodKey: string) => {
  const nextMonth = addMonths(parsePeriodStart(periodKey), 1);
  const monthLabel = nextMonth.toLocaleDateString('es-DO', { month: 'long' });
  const capitalizedMonth =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return [
    {
      date: buildFiscalDate(periodKey, 1, 15),
      label: 'Envio formatos 606, 607, 608',
      tone: 'warning' as const,
    },
    {
      date: buildFiscalDate(periodKey, 1, 20),
      label: `Pago ITBIS (IT-1) - ${capitalizedMonth}`,
      tone: 'warning' as const,
    },
    {
      date: buildFiscalDate(periodKey, 1, 30),
      label: 'Retención ISR asalariados',
      tone: 'success' as const,
    },
    {
      date: buildFiscalDate(periodKey, 2, 15),
      label: 'Envio IR-17 - anticipo',
      tone: 'success' as const,
    },
    {
      date: buildFiscalDate(periodKey, 3, 28),
      label: 'Declaración jurada anual IR-2',
      tone: 'success' as const,
    },
  ];
};

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
      new Set([effectivePeriodKey, ...periods, ...runPeriodKeys].filter(Boolean)),
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
                  <HeroChip
                    className="w-fit"
                    color={getStatusChipColor(run.status)}
                    variant="soft"
                  >
                    <HeroChip.Label>
                      {resolveMonthlyComplianceStatusLabel(run.status)}
                    </HeroChip.Label>
                  </HeroChip>
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

          <HeroButton
            size="sm"
            variant="primary"
            isDisabled={monthlyComplianceActionsDisabled}
            isPending={running}
            onPress={() => void handleRun(activeTab)}
          >
            Generar {REPORT_LABELS[activeTab]}
          </HeroButton>
          <HeroButton
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
          </HeroButton>
          <HeroButton
            isIconOnly
            aria-label="Ver corridas e issues"
            size="sm"
            variant="secondary"
            onPress={handleOpenRunsModal}
          >
            <HistoryOutlined />
          </HeroButton>
        </Toolbar>
      </SectionHeader>

      <ExecutiveGrid>
        <ExecutiveCard>
          <HeroCard.Header>
            <ExecutiveLabel>Total a pagar ITBIS</ExecutiveLabel>
          </HeroCard.Header>
          <HeroCard.Content>
            <ExecutiveValue>
              {formatCurrency(getDgii606ItbisTotal(latest606Run))}
            </ExecutiveValue>
            <ExecutiveMeta>
              Vence {formatFiscalDate(itbisPaymentDate)} · IT-1
            </ExecutiveMeta>
          </HeroCard.Content>
        </ExecutiveCard>
        {REPORT_CODES.map((reportCode) => {
          const latestRun = latestRunByCode[reportCode];
          return (
            <ExecutiveCard key={reportCode}>
              <HeroCard.Header>
                <ExecutiveLabel>
                  Registros {REPORT_LABELS[reportCode]}
                  {reportCode === 'DGII_608' ? ' (anulados)' : ''}
                </ExecutiveLabel>
              </HeroCard.Header>
              <HeroCard.Content>
                <ExecutiveValue>{getRunRecordCount(latestRun)}</ExecutiveValue>
                <HeroChip
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
                  <HeroChip.Label>
                    {latestRun
                      ? latestRun.validationSummary.totalIssues
                        ? `${latestRun.validationSummary.totalIssues} issues`
                        : 'Validado'
                      : 'Sin corrida'}
                  </HeroChip.Label>
                </HeroChip>
              </HeroCard.Content>
            </ExecutiveCard>
          );
        })}
      </ExecutiveGrid>

      {error ? (
        <ComplianceAlert status="danger">
          <HeroAlert.Content>
            <HeroAlert.Title>
              No se pudieron cargar las corridas de cumplimiento fiscal.
            </HeroAlert.Title>
            <HeroAlert.Description>{error}</HeroAlert.Description>
          </HeroAlert.Content>
        </ComplianceAlert>
      ) : null}

      {!monthlyComplianceResolved ? (
        <ComplianceAlert status="accent">
          <HeroAlert.Content>
            <HeroAlert.Title>
              Validando habilitacion de compliance mensual DGII.
            </HeroAlert.Title>
            <HeroAlert.Description>
              Las acciones de generar y exportar se activaran cuando el estado
              fiscal del negocio este confirmado.
            </HeroAlert.Description>
          </HeroAlert.Content>
        </ComplianceAlert>
      ) : !monthlyComplianceAvailable ? (
        <ComplianceAlert status="warning">
          <HeroAlert.Content>
            <HeroAlert.Title>
              Compliance mensual DGII no habilitado.
            </HeroAlert.Title>
            <HeroAlert.Description>
              {monthlyComplianceUnavailableMessage}
            </HeroAlert.Description>
          </HeroAlert.Content>
        </ComplianceAlert>
      ) : null}

      <WorkspaceWrapper>{renderReportWorkspace(activeTab)}</WorkspaceWrapper>

      {runsModalOpen ? (
        <HeroModal.Backdrop
          isOpen={runsModalOpen}
          onOpenChange={handleRunsModalOpenChange}
          className="z-[350]"
        >
          <HeroModal.Container
            placement="top"
            scroll="inside"
            size="cover"
            className="max-w-[1040px] mt-4"
          >
            <HeroModal.Dialog>
              <HeroModal.Header>
                <HeroModal.Heading>
                  Corridas e issues ·{' '}
                  {formatAccountingPeriod(effectivePeriodKey)}
                </HeroModal.Heading>
                <HeroModal.CloseTrigger />
              </HeroModal.Header>
              <HeroModal.Body>
                <ModalBody>{renderRunsWorkspace()}</ModalBody>
              </HeroModal.Body>
            </HeroModal.Dialog>
          </HeroModal.Container>
        </HeroModal.Backdrop>
      ) : null}

      <SupportGrid>
        <HeroCard>
          <HeroCard.Header>
            <DetailTitle>Calendario fiscal</DetailTitle>
          </HeroCard.Header>
          <HeroCard.Content>
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
          </HeroCard.Content>
        </HeroCard>

        <HeroCard>
          <HeroCard.Header>
            <DetailTitle>Historial de corridas DGII</DetailTitle>
          </HeroCard.Header>
          <HeroCard.Content>
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
          </HeroCard.Content>
        </HeroCard>
      </SupportGrid>

    </Panel>
  );
};

const Dgii606Preview = ({ run }: { run: MonthlyComplianceRun }) => {
  const rows = useMemo(() => getDgii606Rows(run), [run]);
  const excludedRows = useMemo(() => getDgii606ExcludedRows(run), [run]);

  return (
    <PreviewPanel>
      <HeroCard.Header>
        <PreviewHeader>
          <div>
            <DetailTitle>Detalle 606</DetailTitle>
            <SectionDescription>
              Compras y gastos normalizados para revisión legal del periodo.
            </SectionDescription>
          </div>
          <HeroChip
            className="w-fit"
            color={getStatusChipColor(run.status)}
            variant="soft"
          >
            <HeroChip.Label>
              {resolveMonthlyComplianceStatusLabel(run.status)}
            </HeroChip.Label>
          </HeroChip>
        </PreviewHeader>
      </HeroCard.Header>
      <HeroCard.Content>
        <HeroTable>
          <HeroTable.ScrollContainer>
            <HeroTable.Content
              aria-label="Detalle 606"
              className="min-w-[1320px]"
            >
              <HeroTable.Header>
                <HeroTable.Column isRowHeader>Fuente</HeroTable.Column>
                <HeroTable.Column>Documento</HeroTable.Column>
                <HeroTable.Column>ID origen</HeroTable.Column>
                <HeroTable.Column>RNC proveedor</HeroTable.Column>
                <HeroTable.Column>Tipo gasto</HeroTable.Column>
                <HeroTable.Column>NCF</HeroTable.Column>
                <HeroTable.Column>Fecha</HeroTable.Column>
                <HeroTable.Column>Pago</HeroTable.Column>
                <HeroTable.Column>Forma pago</HeroTable.Column>
                <HeroTable.Column>Servicios</HeroTable.Column>
                <HeroTable.Column>Bienes</HeroTable.Column>
                <HeroTable.Column>Total</HeroTable.Column>
                <HeroTable.Column>ITBIS</HeroTable.Column>
                <HeroTable.Column>Estado</HeroTable.Column>
              </HeroTable.Header>
              <HeroTable.Body
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
                  <HeroTable.Row
                    id={`${row.sourceId}-${row.recordId ?? row.index}`}
                  >
                    <HeroTable.Cell>
                      {translateSourceId(String(row.sourceId))}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.documentNumber)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.recordId)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.counterpartyIdentificationNumber)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.expenseType)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.documentFiscalNumber)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatShortDate(row.issuedAt)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatShortDate(row.paymentAt)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.paymentFormCode)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatMoney(row.serviceAmount)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatMoney(row.goodsAmount)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>{formatMoney(row.total)}</HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatMoney(row.itbisTotal)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      <HeroChip color="default" size="sm" variant="soft">
                        <HeroChip.Label>
                          {toPreviewText(row.status)}
                        </HeroChip.Label>
                      </HeroChip>
                    </HeroTable.Cell>
                  </HeroTable.Row>
                )}
              </HeroTable.Body>
            </HeroTable.Content>
          </HeroTable.ScrollContainer>
        </HeroTable>

        {excludedRows.length ? (
          <ExcludedRecordsTable
            rows={excludedRows}
            title="Registros leidos que no entran al 606"
          />
        ) : null}
      </HeroCard.Content>
    </PreviewPanel>
  );
};

const Dgii607Preview = ({ run }: { run: MonthlyComplianceRun }) => {
  const rows = useMemo(() => getDgii607Rows(run), [run]);
  const excludedRows = useMemo(() => getDgii607ExcludedRows(run), [run]);

  return (
    <PreviewPanel>
      <HeroCard.Header>
        <PreviewHeader>
          <div>
            <DetailTitle>Detalle 607</DetailTitle>
            <SectionDescription>
              Ventas con NCF tipo B01 (credito fiscal) y B02 (consumidor final,
              agrupable).
            </SectionDescription>
          </div>
          <HeroChip
            className="w-fit"
            color={getStatusChipColor(run.status)}
            variant="soft"
          >
            <HeroChip.Label>
              {resolveMonthlyComplianceStatusLabel(run.status)}
            </HeroChip.Label>
          </HeroChip>
        </PreviewHeader>
      </HeroCard.Header>
      <HeroCard.Content>
        <HeroTable>
          <HeroTable.ScrollContainer>
            <HeroTable.Content
              aria-label="Detalle 607"
              className="min-w-[1680px]"
            >
              <HeroTable.Header>
                <HeroTable.Column isRowHeader>RNC cliente</HeroTable.Column>
                <HeroTable.Column>Fuente</HeroTable.Column>
                <HeroTable.Column>Documento</HeroTable.Column>
                <HeroTable.Column>NCF</HeroTable.Column>
                <HeroTable.Column>Tipo</HeroTable.Column>
                <HeroTable.Column>Fecha</HeroTable.Column>
                <HeroTable.Column>Total</HeroTable.Column>
                <HeroTable.Column>ITBIS</HeroTable.Column>
                <HeroTable.Column>ITBIS retenido</HeroTable.Column>
                <HeroTable.Column>ISR retenido</HeroTable.Column>
                <HeroTable.Column>Efectivo</HeroTable.Column>
                <HeroTable.Column>Cheque/Tr.</HeroTable.Column>
                <HeroTable.Column>Tarjeta</HeroTable.Column>
                <HeroTable.Column>Crédito</HeroTable.Column>
                <HeroTable.Column>Factura ref.</HeroTable.Column>
                <HeroTable.Column>Estado</HeroTable.Column>
              </HeroTable.Header>
              <HeroTable.Body
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
                  <HeroTable.Row
                    id={`${row.sourceId}-${row.recordId ?? row.index}`}
                  >
                    <HeroTable.Cell>
                      {toPreviewText(row.counterpartyIdentificationNumber)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {translateSourceId(String(row.sourceId))}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.documentNumber)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.documentFiscalNumber)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {resolveDgiiDocumentType(row.documentFiscalNumber)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatShortDate(row.retentionDate ?? row.issuedAt)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>{formatMoney(row.total)}</HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatMoney(row.itbisTotal)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatMoney(row.itbisWithheld)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatMoney(row.incomeTaxWithheld)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>{formatMoney(row.cash)}</HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatMoney(row.checkTransfer)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>{formatMoney(row.card)}</HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatMoney(row.creditSale)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.invoiceId ?? row.invoiceNcf)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      <HeroChip color="default" size="sm" variant="soft">
                        <HeroChip.Label>
                          {toPreviewText(row.status)}
                        </HeroChip.Label>
                      </HeroChip>
                    </HeroTable.Cell>
                  </HeroTable.Row>
                )}
              </HeroTable.Body>
            </HeroTable.Content>
          </HeroTable.ScrollContainer>
        </HeroTable>

        {excludedRows.length ? (
          <ExcludedRecordsTable
            rows={excludedRows}
            title="Registros leidos que no entran al 607"
          />
        ) : null}
      </HeroCard.Content>
    </PreviewPanel>
  );
};

const Dgii608Preview = ({ run }: { run: MonthlyComplianceRun }) => {
  const rows = useMemo(() => getDgii608Rows(run), [run]);

  return (
    <PreviewPanel>
      <HeroCard.Header>
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
          <HeroChip
            className="w-fit"
            color={getStatusChipColor(run.status)}
            variant="soft"
          >
            <HeroChip.Label>
              {resolveMonthlyComplianceStatusLabel(run.status)}
            </HeroChip.Label>
          </HeroChip>
        </PreviewHeader>
      </HeroCard.Header>
      <HeroCard.Content>
        <HeroTable>
          <HeroTable.ScrollContainer>
            <HeroTable.Content
              aria-label="Detalle 608"
              className="min-w-[1040px]"
            >
              <HeroTable.Header>
                <HeroTable.Column isRowHeader>Fuente</HeroTable.Column>
                <HeroTable.Column>Documento</HeroTable.Column>
                <HeroTable.Column>NCF anulado</HeroTable.Column>
                <HeroTable.Column>Fecha</HeroTable.Column>
                <HeroTable.Column>Razon</HeroTable.Column>
                <HeroTable.Column>Descripcion</HeroTable.Column>
                <HeroTable.Column>Factura ref.</HeroTable.Column>
                <HeroTable.Column>ID origen</HeroTable.Column>
                <HeroTable.Column>Estado</HeroTable.Column>
              </HeroTable.Header>
              <HeroTable.Body
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
                  <HeroTable.Row
                    id={`${row.sourceId}-${row.recordId ?? row.index}`}
                  >
                    <HeroTable.Cell>
                      {translateSourceId(String(row.sourceId))}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.documentNumber)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.documentFiscalNumber)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {formatShortDate(row.issuedAt)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.reasonCode)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.reasonLabel ?? row.reason)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.invoiceId)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      {toPreviewText(row.recordId)}
                    </HeroTable.Cell>
                    <HeroTable.Cell>
                      <HeroChip color="default" size="sm" variant="soft">
                        <HeroChip.Label>
                          {toPreviewText(row.status) === '-'
                            ? 'Registrado'
                            : toPreviewText(row.status)}
                        </HeroChip.Label>
                      </HeroChip>
                    </HeroTable.Cell>
                  </HeroTable.Row>
                )}
              </HeroTable.Body>
            </HeroTable.Content>
          </HeroTable.ScrollContainer>
        </HeroTable>
      </HeroCard.Content>
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
    <HeroTable>
      <HeroTable.ScrollContainer>
        <HeroTable.Content aria-label={title} className="min-w-[1040px]">
          <HeroTable.Header>
            <HeroTable.Column isRowHeader>Fuente</HeroTable.Column>
            <HeroTable.Column>Documento</HeroTable.Column>
            <HeroTable.Column>ID origen</HeroTable.Column>
            <HeroTable.Column>NCF</HeroTable.Column>
            <HeroTable.Column>Fecha</HeroTable.Column>
            <HeroTable.Column>Total</HeroTable.Column>
            <HeroTable.Column>ITBIS</HeroTable.Column>
            <HeroTable.Column>Estado</HeroTable.Column>
            <HeroTable.Column>Motivo</HeroTable.Column>
          </HeroTable.Header>
          <HeroTable.Body items={rows}>
            {(row) => (
              <HeroTable.Row
                id={`${row.sourceId}-${row.recordId ?? row.index}`}
              >
                <HeroTable.Cell>
                  {translateSourceId(String(row.sourceId))}
                </HeroTable.Cell>
                <HeroTable.Cell>
                  {toPreviewText(row.documentNumber)}
                </HeroTable.Cell>
                <HeroTable.Cell>{toPreviewText(row.recordId)}</HeroTable.Cell>
                <HeroTable.Cell>
                  {toPreviewText(row.documentFiscalNumber)}
                </HeroTable.Cell>
                <HeroTable.Cell>
                  {formatShortDate(row.retentionDate ?? row.issuedAt)}
                </HeroTable.Cell>
                <HeroTable.Cell>{formatMoney(row.total)}</HeroTable.Cell>
                <HeroTable.Cell>{formatMoney(row.itbisTotal)}</HeroTable.Cell>
                <HeroTable.Cell>
                  <HeroChip color="default" size="sm" variant="soft">
                    <HeroChip.Label>{toPreviewText(row.status)}</HeroChip.Label>
                  </HeroChip>
                </HeroTable.Cell>
                <HeroTable.Cell>{resolveExcludedReason(row)}</HeroTable.Cell>
              </HeroTable.Row>
            )}
          </HeroTable.Body>
        </HeroTable.Content>
      </HeroTable.ScrollContainer>
    </HeroTable>
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
        <HeroChip
          className="w-fit"
          color={getStatusChipColor(run.status)}
          variant="soft"
        >
          <HeroChip.Label>
            {resolveMonthlyComplianceStatusLabel(run.status)}
          </HeroChip.Label>
        </HeroChip>
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
          <HeroAlert.Content>
            <HeroAlert.Title>Huecos pendientes del builder</HeroAlert.Title>
            <HeroAlert.Description>
              <GapList>
                {run.validationSummary.pendingGaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </GapList>
            </HeroAlert.Description>
          </HeroAlert.Content>
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
                    <HeroChip.Label>
                      {translateSeverity(issue.severity)}
                    </HeroChip.Label>
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

const ComplianceAlert = styled(HeroAlert)`
  .alert__title {
    font-weight: var(--ds-font-weight-semibold);
  }

  .alert__description {
    color: var(--ds-color-text-secondary);
  }
`;

const IssueSeverityChip = styled(HeroChip)`
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

const ExecutiveCard = styled(HeroCard)`
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

const PreviewPanel = styled(HeroCard)`
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
