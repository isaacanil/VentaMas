import {
  DownloadOutlined,
  HistoryOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import {
  Alert as HeroAlert,
  Button as HeroButton,
  Card as HeroCard,
  Chip as HeroChip,
  Dropdown as HeroDropdown,
  ListBox,
  Modal as HeroModal,
  Select as HeroSelect,
  Tabs as HeroTabs,
} from '@heroui/react';
import { message } from 'antd';
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
) => {
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
  const { error, runs } = useMonthlyComplianceRuns({
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
          <PeriodSelect
            aria-label="Periodo fiscal"
            selectedKey={effectivePeriodKey}
            variant="secondary"
            onSelectionChange={(key) => {
              if (key) setRequestedPeriodKey(String(key));
            }}
          >
            <HeroSelect.Trigger>
              <HeroSelect.Value />
              <HeroSelect.Indicator />
            </HeroSelect.Trigger>
            <HeroSelect.Popover>
              <ListBox>
                {periodOptions.map((option) => (
                  <ListBox.Item
                    key={option.value}
                    id={option.value}
                    textValue={option.label}
                  >
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </HeroSelect.Popover>
          </PeriodSelect>
          <HeroButton
            size="sm"
            variant="primary"
            isPending={running}
            onPress={() => void handleRun(activeTab)}
          >
            Generar {REPORT_LABELS[activeTab]}
          </HeroButton>
          {activeTab === 'DGII_607' || activeTab === 'DGII_608' ? (
            <HeroButton
              size="sm"
              variant="secondary"
              isPending={exportingReportCode === activeTab}
              onPress={() => void handleExportTxt(activeTab)}
            >
              <DownloadOutlined />
              Exportar TXT
            </HeroButton>
          ) : null}
          <HeroDropdown>
            <HeroButton
              isIconOnly
              aria-label="Mas acciones de cumplimiento fiscal"
              size="sm"
              variant="secondary"
            >
              <MoreOutlined />
            </HeroButton>
            <HeroDropdown.Popover placement="bottom end">
              <HeroDropdown.Menu
                aria-label="Acciones de cumplimiento fiscal"
                onAction={(key) => {
                  if (key === 'runs') handleOpenRunsModal();
                }}
              >
                <HeroDropdown.Item
                  id="runs"
                  key="runs"
                  textValue="Ver corridas e issues"
                >
                  <span data-slot="label">
                    <HistoryOutlined />
                    Ver corridas e issues
                  </span>
                </HeroDropdown.Item>
              </HeroDropdown.Menu>
            </HeroDropdown.Popover>
          </HeroDropdown>
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
                <MiniStatus
                  $tone={
                    !latestRun
                      ? 'neutral'
                      : latestRun.validationSummary.totalIssues
                        ? 'warning'
                        : 'success'
                  }
                >
                  {latestRun
                    ? latestRun.validationSummary.totalIssues
                      ? `${latestRun.validationSummary.totalIssues} issues`
                      : 'Validado'
                    : 'Sin corrida'}
                </MiniStatus>
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

      <StyledTabs
        selectedKey={activeTab}
        variant="secondary"
        onSelectionChange={(key) => setActiveTab(key as FiscalComplianceTabKey)}
      >
        <HeroTabs.ListContainer>
          <HeroTabs.List aria-label="Reportes fiscales DGII">
            {REPORT_CODES.map((reportCode) => (
              <HeroTabs.Tab key={reportCode} id={reportCode}>
                {REPORT_LABELS[reportCode]}
                <HeroTabs.Indicator />
              </HeroTabs.Tab>
            ))}
          </HeroTabs.List>
        </HeroTabs.ListContainer>
        {REPORT_CODES.map((reportCode) => (
          <HeroTabs.Panel key={reportCode} id={reportCode}>
            {renderReportWorkspace(reportCode)}
          </HeroTabs.Panel>
        ))}
      </StyledTabs>

      <HeroModal.Backdrop
        isOpen={runsModalOpen}
        onOpenChange={(open) => setRunsModalOpen(open)}
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
                Corridas e issues · {formatAccountingPeriod(effectivePeriodKey)}
              </HeroModal.Heading>
              <HeroModal.CloseTrigger />
            </HeroModal.Header>
            <HeroModal.Body>
              <ModalBody>{renderRunsWorkspace()}</ModalBody>
            </HeroModal.Body>
          </HeroModal.Dialog>
        </HeroModal.Container>
      </HeroModal.Backdrop>

      <SupportGrid>
        <SupportPanel>
          <SupportTitle>Calendario fiscal</SupportTitle>
          <SupportList>
            {fiscalCalendarItems.map((item) => {
              const daysUntil = getDaysUntil(item.date);
              return (
                <SupportRow
                  key={`${item.label}-${formatFiscalDate(item.date)}`}
                >
                  <SupportDate>{formatFiscalDate(item.date)}</SupportDate>
                  <SupportMain>{item.label}</SupportMain>
                  <SupportAside>
                    {daysUntil >= 0 ? `en ${daysUntil} dias` : 'vencido'}
                  </SupportAside>
                  <MiniStatus $tone={item.tone}>
                    {item.tone === 'warning' ? 'Proximo' : 'Programado'}
                  </MiniStatus>
                </SupportRow>
              );
            })}
          </SupportList>
        </SupportPanel>

        <SupportPanel>
          <SupportTitle>Historial de corridas DGII</SupportTitle>
          {!recentHistoryRuns.length ? (
            <SupportEmpty>Sin corridas registradas.</SupportEmpty>
          ) : (
            <SupportList>
              {recentHistoryRuns.map((run) => (
                <SupportRow key={run.id}>
                  <SupportDate>
                    {formatMonthlyComplianceRunDate(run.createdAt)}
                  </SupportDate>
                  <SupportMain>
                    {formatAccountingPeriod(run.periodKey)}
                    <SupportSubtext>
                      {REPORT_LABELS[run.reportCode]} · v{run.version}
                    </SupportSubtext>
                  </SupportMain>
                  <SupportAside>
                    {run.validationSummary.totalIssues} issues
                  </SupportAside>
                  <MiniStatus $tone={getStatusTone(run.status)}>
                    {resolveMonthlyComplianceStatusLabel(run.status)}
                  </MiniStatus>
                </SupportRow>
              ))}
            </SupportList>
          )}
        </SupportPanel>
      </SupportGrid>
    </Panel>
  );
};

const Dgii606Preview = ({ run }: { run: MonthlyComplianceRun }) => {
  const rows = getDgii606Rows(run);
  const excludedRows = getDgii606ExcludedRows(run);

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
          <StatusTag $tone={getStatusTone(run.status)}>
            {resolveMonthlyComplianceStatusLabel(run.status)}
          </StatusTag>
        </PreviewHeader>
      </HeroCard.Header>
      <HeroCard.Content>
        {!rows.length ? (
          <EmptyStateCard>
            <strong>Sin registros 606 visibles.</strong>
            <span>
              Genera una corrida nueva o revisa si el periodo tiene compras y
              gastos registrados.
            </span>
          </EmptyStateCard>
        ) : (
          <PreviewTableWrap>
            <PreviewTable>
              <thead>
                <tr>
                  <th>Fuente</th>
                  <th>Documento</th>
                  <th>ID origen</th>
                  <th>RNC proveedor</th>
                  <th>Tipo gasto</th>
                  <th>NCF</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>ITBIS</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.sourceId}-${row.recordId ?? row.index}`}>
                    <td>{translateSourceId(String(row.sourceId))}</td>
                    <td>{toPreviewText(row.documentNumber)}</td>
                    <td>{toPreviewText(row.recordId)}</td>
                    <td>
                      {toPreviewText(row.counterpartyIdentificationNumber)}
                    </td>
                    <td>{toPreviewText(row.expenseType)}</td>
                    <td>{toPreviewText(row.documentFiscalNumber)}</td>
                    <td>{formatShortDate(row.issuedAt)}</td>
                    <td>{formatMoney(row.total)}</td>
                    <td>{formatMoney(row.itbisTotal)}</td>
                    <td>
                      <InlineStatus>{toPreviewText(row.status)}</InlineStatus>
                    </td>
                  </tr>
                ))}
              </tbody>
            </PreviewTable>
          </PreviewTableWrap>
        )}

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
  const rows = getDgii607Rows(run);
  const excludedRows = getDgii607ExcludedRows(run);

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
          <StatusTag $tone={getStatusTone(run.status)}>
            {resolveMonthlyComplianceStatusLabel(run.status)}
          </StatusTag>
        </PreviewHeader>
      </HeroCard.Header>
      <HeroCard.Content>
        {!rows.length ? (
          <EmptyStateCard>
            <strong>Sin registros 607 visibles.</strong>
            <span>
              No hay ventas con NCF B01/B02 en la corrida activa. Las facturas
              sin comprobante fiscal no entran al 607.
            </span>
          </EmptyStateCard>
        ) : (
          <PreviewTableWrap>
            <WidePreviewTable>
              <thead>
                <tr>
                  <th>RNC cliente</th>
                  <th>Fuente</th>
                  <th>Documento</th>
                  <th>NCF</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>ITBIS</th>
                  <th>ITBIS retenido</th>
                  <th>ISR retenido</th>
                  <th>Efectivo</th>
                  <th>Cheque/Tr.</th>
                  <th>Tarjeta</th>
                  <th>Crédito</th>
                  <th>Factura ref.</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.sourceId}-${row.recordId ?? row.index}`}>
                    <td>
                      {toPreviewText(row.counterpartyIdentificationNumber)}
                    </td>
                    <td>{translateSourceId(String(row.sourceId))}</td>
                    <td>{toPreviewText(row.documentNumber)}</td>
                    <td>{toPreviewText(row.documentFiscalNumber)}</td>
                    <td>{resolveDgiiDocumentType(row.documentFiscalNumber)}</td>
                    <td>
                      {formatShortDate(row.retentionDate ?? row.issuedAt)}
                    </td>
                    <td>{formatMoney(row.total)}</td>
                    <td>{formatMoney(row.itbisTotal)}</td>
                    <td>{formatMoney(row.itbisWithheld)}</td>
                    <td>{formatMoney(row.incomeTaxWithheld)}</td>
                    <td>{formatMoney(row.cash)}</td>
                    <td>{formatMoney(row.checkTransfer)}</td>
                    <td>{formatMoney(row.card)}</td>
                    <td>{formatMoney(row.creditSale)}</td>
                    <td>{toPreviewText(row.invoiceId ?? row.invoiceNcf)}</td>
                    <td>
                      <InlineStatus>{toPreviewText(row.status)}</InlineStatus>
                    </td>
                  </tr>
                ))}
              </tbody>
            </WidePreviewTable>
          </PreviewTableWrap>
        )}

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
  const rows = getDgii608Rows(run);

  return (
    <PreviewPanel>
      <HeroCard.Header>
        <PreviewHeader>
          <div>
            <DetailTitle>Detalle 608</DetailTitle>
            <SectionDescription>
              NCF anulados. Razon: 01 Deterioro - 02 Errores impresion - 03
              Impresion defectuosa - 04 Duplicidad - 05 Cese operaciones - 06
              Perdida - 07 Otros.
            </SectionDescription>
          </div>
          <StatusTag $tone={getStatusTone(run.status)}>
            {resolveMonthlyComplianceStatusLabel(run.status)}
          </StatusTag>
        </PreviewHeader>
      </HeroCard.Header>
      <HeroCard.Content>
        {!rows.length ? (
          <EmptyStateCard>
            <strong>Sin registros 608 visibles.</strong>
            <span>
              Genera una corrida nueva o revisa si el periodo tiene comprobantes
              anulados.
            </span>
          </EmptyStateCard>
        ) : (
          <PreviewTableWrap>
            <PreviewTable>
              <thead>
                <tr>
                  <th>Fuente</th>
                  <th>Documento</th>
                  <th>NCF anulado</th>
                  <th>Fecha</th>
                  <th>Razon</th>
                  <th>Descripcion</th>
                  <th>Factura ref.</th>
                  <th>ID origen</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.sourceId}-${row.recordId ?? row.index}`}>
                    <td>{translateSourceId(String(row.sourceId))}</td>
                    <td>{toPreviewText(row.documentNumber)}</td>
                    <td>{toPreviewText(row.documentFiscalNumber)}</td>
                    <td>{formatShortDate(row.issuedAt)}</td>
                    <td>{toPreviewText(row.reasonCode)}</td>
                    <td>{toPreviewText(row.reasonLabel ?? row.reason)}</td>
                    <td>{toPreviewText(row.invoiceId)}</td>
                    <td>{toPreviewText(row.recordId)}</td>
                    <td>
                      <InlineStatus>
                        {toPreviewText(row.status) === '-'
                          ? 'Registrado'
                          : toPreviewText(row.status)}
                      </InlineStatus>
                    </td>
                  </tr>
                ))}
              </tbody>
            </PreviewTable>
          </PreviewTableWrap>
        )}
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
    <PreviewTableWrap>
      <PreviewTable>
        <thead>
          <tr>
            <th>Fuente</th>
            <th>Documento</th>
            <th>ID origen</th>
            <th>NCF</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>ITBIS</th>
            <th>Estado</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.sourceId}-${row.recordId ?? row.index}`}>
              <td>{translateSourceId(String(row.sourceId))}</td>
              <td>{toPreviewText(row.documentNumber)}</td>
              <td>{toPreviewText(row.recordId)}</td>
              <td>{toPreviewText(row.documentFiscalNumber)}</td>
              <td>{formatShortDate(row.retentionDate ?? row.issuedAt)}</td>
              <td>{formatMoney(row.total)}</td>
              <td>{formatMoney(row.itbisTotal)}</td>
              <td>
                <InlineStatus>{toPreviewText(row.status)}</InlineStatus>
              </td>
              <td>{resolveExcludedReason(row)}</td>
            </tr>
          ))}
        </tbody>
      </PreviewTable>
    </PreviewTableWrap>
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
            {visibleIssues.map((issue, index) => (
              <IssueItem key={`${run.id}-issue-${issue.key}-${index}`}>
                <IssueTop>
                  <IssueSeverityChip
                    color={issue.severity === 'error' ? 'danger' : 'warning'}
                    size="sm"
                    variant="outline"
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

const PeriodSelect = styled(HeroSelect)`
  width: 196px;
  min-width: 196px;
  flex: 0 0 auto;
`;

const StyledTabs = styled(HeroTabs)`
  gap: var(--ds-space-4);
`;

const ComplianceAlert = styled(HeroAlert)`
  .alert__title {
    font-weight: var(--ds-font-weight-semibold);
  }

  .alert__description {
    color: var(--ds-color-text-secondary);
  }
`;

const StatusTag = styled(HeroChip)<{
  $tone: 'success' | 'warning' | 'neutral';
}>`
  border-radius: var(--ds-radius-pill);
  padding-inline: 10px;
  font-weight: var(--ds-font-weight-medium);

  ${({ $tone }) =>
    $tone === 'success'
      ? `
    background: var(--ds-color-state-success-subtle);
    border: 1px solid var(--ds-color-state-success);
    color: var(--ds-color-state-success-text);
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

const MiniStatus = styled.span<{
  $tone: 'success' | 'warning' | 'neutral';
}>`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: var(--ds-radius-pill);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);

  ${({ $tone }) =>
    $tone === 'success'
      ? `
    background: #dcfce7;
    color: #166534;
  `
      : $tone === 'warning'
        ? `
    background: var(--ds-color-state-warning-subtle);
    color: var(--ds-color-state-warning-text);
  `
        : `
    background: var(--ds-color-bg-surface-hover);
    color: var(--ds-color-text-secondary);
  `}

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: var(--ds-radius-pill);
    background: currentColor;
  }
`;

const SupportGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-4);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const SupportPanel = styled.section`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
  overflow: hidden;
`;

const SupportTitle = styled.h3`
  margin: 0;
  padding: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
`;

const SupportList = styled.div`
  display: flex;
  flex-direction: column;
`;

const SupportRow = styled.div`
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) auto auto;
  gap: var(--ds-space-3);
  align-items: center;
  padding: var(--ds-space-3) var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
`;

const SupportDate = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  font-variant-numeric: tabular-nums;
`;

const SupportMain = styled.span`
  min-width: 0;
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-medium);
`;

const SupportSubtext = styled.span`
  display: block;
  margin-top: 2px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

const SupportAside = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  white-space: nowrap;
`;

const SupportEmpty = styled.p`
  margin: 0;
  padding: var(--ds-space-4);
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

const PreviewTableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-md);
`;

const PreviewTable = styled.table`
  width: 100%;
  min-width: 840px;
  border-collapse: collapse;
  font-size: var(--ds-font-size-sm);

  th,
  td {
    padding: var(--ds-space-3);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    text-align: left;
    white-space: nowrap;
  }

  th {
    background: var(--ds-color-bg-surface-hover);
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--ds-letter-spacing-wide);
  }

  td {
    color: var(--ds-color-text-primary);
    font-variant-numeric: tabular-nums;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

const WidePreviewTable = styled(PreviewTable)`
  min-width: 1680px;
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

const InlineStatus = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--ds-radius-pill);
  background: var(--ds-color-bg-surface-hover);
  border: 1px solid var(--ds-color-border-subtle);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
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
