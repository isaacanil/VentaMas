import { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { VmAlert, VmButton, VmDropdown } from '@/components/heroui';
import {
  ArrowLeftOutlined,
  DownOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SettingOutlined,
  SyncOutlined,
} from '@/constants/icons/antd';
import {
  adjustHrPayrollLinePayable,
  manageHrCommissionPeriod,
  recordHrPayrollPayment,
  saveHrCommissionCutRule,
  useHrCommissionCutRules,
  useHrCommissionPeriodEntries,
  useHrEmployeePayments,
  useHrCommissionPeriods,
  useHrPayrollEmployeeLines,
} from '@/firebase/hrPayroll/useHrCommissionPeriods';
import { selectUser } from '@/features/auth/userSlice';
import {
  HrDescription as Description,
  HrDataTable,
  HrInlineStack as InlineStack,
  HrNotice as Notice,
  HrPage as Page,
  HrPageHeader as Header,
  HrStatusTag as StatusTag,
  HrSummaryGrid as SummaryGrid,
  HrSummaryItem as SummaryItem,
  HrSummaryLabel as SummaryLabel,
  HrSummaryValue as SummaryValue,
  HrTitle as Title,
  HrTitleBlock as TitleBlock,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import {
  HR_COMMISSION_CUT_RULE_FREQUENCY_LABELS as FREQUENCY_LABELS,
  formatHrMoney as formatMoney,
  HR_COMMISSION_PERIOD_STATUS_LABELS as STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import ROUTES_NAME from '@/router/routes/routesName';
import type {
  HrCommissionCutRuleInput,
  HrCommissionPeriodStatus,
  HrCommissionPeriodRecord,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';
import {
  buildLineColumns,
  buildPeriodColumns,
} from './HrCommissionPeriodsPage.columns';
import { getErrorMessage } from './HrCommissionPeriodsPage.helpers';
import {
  CutRulesSummary,
  CutRulesSummaryMeta,
  CutRulesSummaryText,
  CutRulesSummaryTitle,
  DetailScreenActions,
  OperationalDescription,
  OperationalEyebrow,
  OperationalName,
  OperationalPanel,
  OperationalStack,
  OperationalTitle,
  PeriodsContent,
  PeriodsToolbar,
  SummaryHint,
  WorkflowStep,
  WorkflowSteps,
} from './HrCommissionPeriodsPage.styles';
import {
  EditHrPayableAmountModal,
  type PayableAmountFormValues,
} from './components/EditHrPayableAmountModal';
import {
  RecordHrPaymentModal,
  type PaymentFormValues,
} from './components/RecordHrPaymentModal';
import { HrCommissionPeriodDetailPanel } from './components/HrCommissionPeriodDetailPanel';
import { HrCommissionCutRulePicker } from './components/HrCommissionCutRulePicker/HrCommissionCutRulePicker';
import { HrCommissionCutRulesModal } from './components/HrCommissionCutRulesModal/HrCommissionCutRulesModal';
import { resolveNextHrCommissionCutRuleRange } from './utils/hrCommissionCutRules';
import { buildHrCommissionPeriodDetailPath } from './utils/hrCommissionPeriodRoutes';
import {
  exportHrCommissionPeriodsPdf,
  exportHrCommissionPeriodsWorkbook,
  type HrCommissionPeriodsPdfMode,
} from './utils/hrCommissionPeriodsExport';

type NoticeState = {
  description?: string;
  status: 'success' | 'danger';
  title: string;
};

type PeriodAction = 'create' | 'close' | 'approve';
type PeriodActionResult = Awaited<ReturnType<typeof manageHrCommissionPeriod>>;

const getPeriodPayableAmount = (period: HrCommissionPeriodRecord): number =>
  period.netAmount ?? period.totalPayableAmount ?? period.totalCommissionAmount;

const getPeriodPaidAmount = (period: HrCommissionPeriodRecord): number => {
  const paidAmount = period.paidAmount ?? 0;
  if (paidAmount > 0) return paidAmount;
  return period.status === 'paid' ? getPeriodPayableAmount(period) : 0;
};

const isPeriodUnpaid = (period: HrCommissionPeriodRecord): boolean =>
  !['cancelled', 'paid'].includes(period.status);

const getPeriodPendingAmount = (period: HrCommissionPeriodRecord): number => {
  if (!isPeriodUnpaid(period)) return 0;
  return Math.max(
    0,
    getPeriodPayableAmount(period) - getPeriodPaidAmount(period),
  );
};

const toPeriodEndMillis = (period: HrCommissionPeriodRecord): number => {
  const value = period.endDate;
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return Number((value as { toMillis: () => unknown }).toMillis()) || 0;
  }
  if (value && typeof value === 'object' && 'toDate' in value) {
    const date = (value as { toDate: () => unknown }).toDate();
    return date instanceof Date ? date.getTime() : 0;
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPeriodStatusTone = (
  status: HrCommissionPeriodStatus,
): 'default' | 'info' | 'success' | 'warning' | 'danger' | 'accent' => {
  if (status === 'draft') return 'info';
  if (status === 'closed') return 'warning';
  if (status === 'partially_paid') return 'accent';
  if (status === 'cancelled') return 'default';
  return 'success';
};

const PERIOD_WORKFLOW_STEPS: Array<{
  label: string;
  statuses: HrCommissionPeriodStatus[];
}> = [
  { label: 'Borrador', statuses: ['draft'] },
  { label: 'Cerrado', statuses: ['closed'] },
  { label: 'Aprobado', statuses: ['approved', 'partially_paid'] },
  { label: 'Pagado', statuses: ['paid'] },
];

const getWorkflowStepState = (
  period: HrCommissionPeriodRecord | null,
  index: number,
) => {
  if (!period) return { active: false, complete: false };
  const activeIndex = PERIOD_WORKFLOW_STEPS.findIndex((step) =>
    step.statuses.includes(period.status),
  );
  return {
    active: activeIndex === index,
    complete: activeIndex > index,
  };
};

const getSelectedPeriodGuidance = (
  period: HrCommissionPeriodRecord | null,
): string => {
  if (!period) return 'Selecciona o genera un corte para revisar el detalle.';
  if (period.status === 'draft') {
    return 'Revisa colaboradores y cierra el corte cuando este listo para aprobar.';
  }
  if (period.status === 'closed') {
    return 'El corte esta cerrado para revision. Aprobalo para habilitar pagos.';
  }
  if (period.status === 'approved') {
    return 'El corte esta aprobado. Registra pagos desde las lineas del detalle.';
  }
  if (period.status === 'partially_paid') {
    return 'Hay pagos parciales. Revisa las lineas pendientes antes de cerrar el ciclo.';
  }
  if (period.status === 'paid') {
    return 'Este corte ya fue pagado. Usa el detalle y los exportes como soporte.';
  }
  return 'Este corte no admite acciones operativas.';
};

const getActionSuccessTitle = (
  action: PeriodAction,
  result: PeriodActionResult,
): string => {
  if (action === 'create') {
    return result.reused
      ? `Corte existente: ${result.entriesCount} comisiones.`
      : `Corte generado: ${result.entriesCount} comisiones.`;
  }

  if (action === 'close') {
    return result.reused
      ? `Corte ya ${STATUS_LABELS[result.status].toLowerCase()}.`
      : 'Corte generado para aprobar.';
  }

  return result.reused
    ? `Corte ya ${STATUS_LABELS[result.status].toLowerCase()}.`
    : 'Corte aprobado.';
};

export default function HrCommissionPeriodsPage() {
  const currentUser = useSelector(selectUser);
  const navigate = useNavigate();
  const { periodId: routePeriodId } = useParams<{ periodId?: string }>();
  const businessId = currentUser?.businessID ?? null;
  const isDetailRoute = Boolean(routePeriodId);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [selectedCutRuleId, setSelectedCutRuleId] = useState<string | null>(
    null,
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [cutRulesModalOpen, setCutRulesModalOpen] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [paymentLine, setPaymentLine] =
    useState<HrPayrollEmployeeLineRecord | null>(null);
  const [paymentActionKey, setPaymentActionKey] = useState<string | null>(null);
  const [adjustmentLine, setAdjustmentLine] =
    useState<HrPayrollEmployeeLineRecord | null>(null);
  const [adjustmentActionKey, setAdjustmentActionKey] = useState<string | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);
  const [exportingPdfMode, setExportingPdfMode] =
    useState<HrCommissionPeriodsPdfMode | null>(null);
  const {
    rows: periods,
    loading,
    error,
  } = useHrCommissionPeriods({
    businessId,
  });
  const {
    rows: cutRules,
    loading: cutRulesLoading,
    error: cutRulesError,
  } = useHrCommissionCutRules({
    businessId,
  });
  const activeCutRules = useMemo(
    () => cutRules.filter((rule) => rule.active),
    [cutRules],
  );
  const effectiveSelectedCutRuleId = activeCutRules.some(
    (rule) => rule.id === selectedCutRuleId,
  )
    ? selectedCutRuleId
    : (activeCutRules[0]?.id ?? null);
  const selectedCutRule =
    activeCutRules.find((rule) => rule.id === effectiveSelectedCutRuleId) ??
    null;
  const selectedCutRuleRange = useMemo(
    () =>
      resolveNextHrCommissionCutRuleRange({
        periods,
        rule: selectedCutRule,
      }),
    [periods, selectedCutRule],
  );
  const selectedPeriodKey = routePeriodId ?? selectedPeriodId;
  const selectedPeriod =
    periods.find((period) => period.id === selectedPeriodKey) ??
    (isDetailRoute ? null : (periods[0] ?? null));
  const {
    rows: employeeLines,
    loading: linesLoading,
    error: linesError,
  } = useHrPayrollEmployeeLines({
    businessId,
    periodId: selectedPeriod?.id,
  });
  const {
    rows: commissionEntries,
    loading: entriesLoading,
    error: entriesError,
  } = useHrCommissionPeriodEntries({
    businessId,
    periodId: selectedPeriod?.id,
  });
  const {
    rows: payments,
    loading: paymentsLoading,
    error: paymentsError,
  } = useHrEmployeePayments({
    businessId,
    periodId: selectedPeriod?.id,
  });

  const summary = useMemo(
    () => ({
      periods: periods.length,
      generatedAmount: periods.reduce(
        (sum, period) => sum + getPeriodPayableAmount(period),
        0,
      ),
      paidAmount: periods.reduce(
        (sum, period) => sum + getPeriodPaidAmount(period),
        0,
      ),
      paidPeriods: periods.filter((period) => period.status === 'paid').length,
      pendingAmount: periods.reduce(
        (sum, period) => sum + getPeriodPendingAmount(period),
        0,
      ),
      pendingPeriods: periods.filter((period) => isPeriodUnpaid(period)).length,
    }),
    [periods],
  );

  const handleAction = useCallback(
    async (action: PeriodAction, period?: HrCommissionPeriodRecord) => {
      if (!businessId) return;
      const key =
        action === 'create' ? 'create' : `${action}:${period?.id ?? 'none'}`;
      setActionKey(key);
      try {
        if (action === 'create' && !effectiveSelectedCutRuleId) {
          throw new Error('Configura y selecciona una regla de corte activa.');
        }

        const result = await manageHrCommissionPeriod({
          action,
          businessId,
          periodId: period?.id,
          ruleId: action === 'create' ? effectiveSelectedCutRuleId : undefined,
        });
        setSelectedPeriodId(result.periodId);
        setNotice({
          status: 'success',
          title: getActionSuccessTitle(action, result),
        });
      } catch (actionError) {
        setNotice({
          status: 'danger',
          title: 'No se pudo completar la accion.',
          description: getErrorMessage(actionError),
        });
      } finally {
        setActionKey(null);
      }
    },
    [businessId, effectiveSelectedCutRuleId],
  );

  const handleSaveCutRule = useCallback(
    async (rule: HrCommissionCutRuleInput) => {
      if (!businessId) return false;

      const key = `cut-rule:save:${rule.id ?? rule.ruleId ?? 'new'}`;
      setActionKey(key);
      try {
        const result = await saveHrCommissionCutRule({
          businessId,
          rule,
        });
        if (result.rule.active) {
          setSelectedCutRuleId(result.ruleId);
        }
        setNotice({
          status: 'success',
          title: 'Regla de corte guardada.',
        });
        return true;
      } catch (ruleError) {
        setNotice({
          status: 'danger',
          title: 'No se pudo guardar la regla.',
          description: getErrorMessage(ruleError),
        });
        return false;
      } finally {
        setActionKey(null);
      }
    },
    [businessId],
  );

  const handleOpenPayment = useCallback((line: HrPayrollEmployeeLineRecord) => {
    setPaymentLine(line);
  }, []);

  const handleOpenAdjustment = useCallback(
    (line: HrPayrollEmployeeLineRecord) => {
      setAdjustmentLine(line);
    },
    [],
  );

  const handleAdjustPayableAmount = async (values: PayableAmountFormValues) => {
    if (!businessId || !adjustmentLine) return;
    const key = `adjust:${adjustmentLine.id}`;
    setAdjustmentActionKey(key);
    try {
      await adjustHrPayrollLinePayable({
        businessId,
        comment: values.comment,
        payrollLineId: adjustmentLine.id,
        totalToPay: values.totalToPay,
      });
      setNotice({
        status: 'success',
        title: 'Total a pagar actualizado.',
        description: 'El comentario quedo registrado en el historial.',
      });
      setAdjustmentLine(null);
    } catch (adjustmentError) {
      setNotice({
        status: 'danger',
        title: 'No se pudo editar el total a pagar.',
        description: getErrorMessage(adjustmentError),
      });
    } finally {
      setAdjustmentActionKey(null);
    }
  };

  const handleRecordPayment = async (values: PaymentFormValues) => {
    if (!businessId || !paymentLine) return;
    const key = `pay:${paymentLine.id}`;
    setPaymentActionKey(key);
    try {
      const result = await recordHrPayrollPayment({
        businessId,
        payrollLineId: paymentLine.id,
        amount: paymentLine.netAmount,
        paymentDate: values.paymentDate ?? new Date(),
        paymentMethod: values.paymentMethod,
        reference: values.reference,
        transferReference: values.transferReference,
        checkNumber: values.checkNumber,
        bankAccountId: values.bankAccountId,
        cashAccountId: values.cashAccountId,
        cashCountId: values.cashCountId,
      });
      setNotice({
        status: 'success',
        title: result.reused
          ? 'Pago ya registrado.'
          : 'Pago de nomina registrado.',
      });
      setPaymentLine(null);
    } catch (paymentError) {
      setNotice({
        status: 'danger',
        title: 'No se pudo registrar el pago.',
        description: getErrorMessage(paymentError),
      });
    } finally {
      setPaymentActionKey(null);
    }
  };

  const handleExportExcel = useCallback(async () => {
    if (!periods.length) {
      message.warning('No hay cortes para exportar.');
      return;
    }

    setExporting(true);
    try {
      await exportHrCommissionPeriodsWorkbook({
        employeeLines,
        payments,
        periods,
        selectedPeriod,
      });
      message.success('Cortes exportados a Excel.');
    } catch (exportError) {
      console.error(
        '[HrCommissionPeriodsPage] excel export failed',
        exportError,
      );
      message.error('No se pudo exportar los cortes.');
    } finally {
      setExporting(false);
    }
  }, [employeeLines, payments, periods, selectedPeriod]);

  const handleExportPdf = useCallback(
    async (mode: HrCommissionPeriodsPdfMode) => {
      if (!selectedPeriod) {
        message.warning('Selecciona un corte para exportar.');
        return;
      }
      if (!employeeLines.length) {
        message.warning('No hay colaboradores para exportar en este corte.');
        return;
      }
      if (mode === 'detail' && !commissionEntries.length) {
        message.warning('No hay detalle de comisiones para exportar.');
        return;
      }

      setExportingPdfMode(mode);
      try {
        await exportHrCommissionPeriodsPdf({
          employeeLines,
          entries: commissionEntries,
          mode,
          selectedPeriod,
        });
        message.success(
          mode === 'general'
            ? 'Resumen general exportado a PDF.'
            : 'Detalle por empleado exportado a PDF.',
        );
      } catch (exportError) {
        console.error(
          '[HrCommissionPeriodsPage] pdf export failed',
          exportError,
        );
        message.error('No se pudo exportar el PDF del corte.');
      } finally {
        setExportingPdfMode(null);
      }
    },
    [commissionEntries, employeeLines, selectedPeriod],
  );

  const handleExportAction = useCallback(
    (key: string | number) => {
      const action = String(key);
      if (action === 'excel') {
        void handleExportExcel();
        return;
      }

      void handleExportPdf(action as HrCommissionPeriodsPdfMode);
    },
    [handleExportExcel, handleExportPdf],
  );

  const handleBackToPeriods = useCallback(() => {
    navigate(ROUTES_NAME.HR_PAYROLL_TERM.HR_COMMISSION_PERIODS);
  }, [navigate]);

  const handleOpenPeriodDetail = useCallback(
    (period: HrCommissionPeriodRecord) => {
      navigate(buildHrCommissionPeriodDetailPath(period.id));
    },
    [navigate],
  );

  const periodColumns = useMemo(
    () =>
      buildPeriodColumns({
        getDetailPath: (period) => buildHrCommissionPeriodDetailPath(period.id),
      }),
    [],
  );

  const lineColumns = useMemo(
    () =>
      buildLineColumns({
        adjustmentActionKey,
        onOpenAdjustment: handleOpenAdjustment,
        paymentActionKey,
        onOpenPayment: handleOpenPayment,
      }),
    [
      adjustmentActionKey,
      handleOpenAdjustment,
      handleOpenPayment,
      paymentActionKey,
    ],
  );
  const selectedPeriodLabel =
    selectedPeriod?.label ||
    selectedPeriod?.periodKey ||
    (isDetailRoute ? 'Corte no encontrado' : 'Corte seleccionado');
  const pendingPeriodsForSelectedRule = useMemo(
    () =>
      selectedCutRule
        ? periods
            .filter(
              (period) =>
                period.cutRuleId === selectedCutRule.id &&
                isPeriodUnpaid(period),
            )
            .sort(
              (left, right) =>
                toPeriodEndMillis(right) - toPeriodEndMillis(left),
            )
        : [],
    [periods, selectedCutRule],
  );
  const selectedPendingPeriodId = pendingPeriodsForSelectedRule.some(
    (period) => period.id === selectedPeriod?.id,
  )
    ? (selectedPeriod?.id ?? null)
    : null;
  const selectedPeriodAmount = selectedPeriod
    ? getPeriodPayableAmount(selectedPeriod)
    : 0;
  const selectedPeriodCurrency = selectedPeriod?.currency ?? 'DOP';
  const activeRuleMeta = selectedCutRule
    ? `${selectedCutRule.label} - ${FREQUENCY_LABELS[selectedCutRule.frequency]}`
    : 'Sin regla activa';
  const nextRangeMeta = selectedCutRuleRange
    ? `${selectedCutRuleRange.startKey} - ${selectedCutRuleRange.endKey}`
    : 'Configura una regla para generar cortes.';
  const createActionLabel =
    actionKey === 'create'
      ? 'Generando corte...'
      : pendingPeriodsForSelectedRule.length
        ? 'Generar siguiente'
        : 'Generar corte';
  const exportDisabled =
    !businessId ||
    loading ||
    linesLoading ||
    entriesLoading ||
    exporting ||
    Boolean(exportingPdfMode) ||
    periods.length === 0 ||
    (isDetailRoute && !selectedPeriod);
  const exportLabel =
    exporting || exportingPdfMode ? 'Exportando...' : 'Exportar';
  const detailPeriodDescription = selectedPeriod
    ? `${selectedPeriodLabel} - ${formatMoney(
        getPeriodPayableAmount(selectedPeriod),
        selectedPeriod.currency,
      )}`
    : null;
  const detailNotFound =
    isDetailRoute && !loading && Boolean(routePeriodId) && !selectedPeriod;
  const operationalPanel = (
    <OperationalPanel>
      <OperationalStack>
        <OperationalEyebrow>Corte seleccionado</OperationalEyebrow>
        <OperationalTitle>
          <OperationalName>{selectedPeriodLabel}</OperationalName>
          {selectedPeriod ? (
            <StatusTag $tone={getPeriodStatusTone(selectedPeriod.status)}>
              {STATUS_LABELS[selectedPeriod.status]}
            </StatusTag>
          ) : null}
        </OperationalTitle>
        <OperationalDescription>
          {selectedPeriod
            ? `${formatMoney(
                selectedPeriodAmount,
                selectedPeriodCurrency,
              )} - ${getSelectedPeriodGuidance(selectedPeriod)}`
            : getSelectedPeriodGuidance(null)}
        </OperationalDescription>
        <OperationalDescription>
          Regla activa: {activeRuleMeta}. Proximo rango: {nextRangeMeta}
        </OperationalDescription>
      </OperationalStack>
      <WorkflowSteps aria-label="Progreso del corte seleccionado">
        {PERIOD_WORKFLOW_STEPS.map((step, index) => {
          const state = getWorkflowStepState(selectedPeriod, index);
          return (
            <WorkflowStep
              key={step.label}
              data-active={state.active ? 'true' : undefined}
              data-complete={state.complete ? 'true' : undefined}
            >
              <span>{`Paso ${index + 1}`}</span>
              <strong>{step.label}</strong>
            </WorkflowStep>
          );
        })}
      </WorkflowSteps>
    </OperationalPanel>
  );
  const exportMenu = (
    <VmDropdown>
      <VmDropdown.Button
        aria-label="Exportar cortes RRHH"
        isDisabled={exportDisabled}
      >
        {exportLabel}
        <DownOutlined />
      </VmDropdown.Button>
      <VmDropdown.Popover placement="bottom end">
        <VmDropdown.Menu
          aria-label="Opciones de exportacion del corte"
          onAction={handleExportAction}
        >
          <VmDropdown.Item id="excel" textValue="Exportar Excel">
            <InlineStack>
              <FileExcelOutlined />
              <span>Excel completo</span>
            </InlineStack>
          </VmDropdown.Item>
          <VmDropdown.Item id="general" textValue="Resumen general">
            <InlineStack>
              <FilePdfOutlined />
              <span>PDF resumen</span>
            </InlineStack>
          </VmDropdown.Item>
          <VmDropdown.Item id="detail" textValue="Detalle por empleado">
            <InlineStack>
              <FilePdfOutlined />
              <span>PDF detalle</span>
            </InlineStack>
          </VmDropdown.Item>
        </VmDropdown.Menu>
      </VmDropdown.Popover>
    </VmDropdown>
  );

  return (
    <>
      <MenuApp
        sectionName={
          isDetailRoute ? 'Detalle corte RRHH' : 'Cortes y pagos RRHH'
        }
        onBackClick={isDetailRoute ? handleBackToPeriods : undefined}
      />
      <Page>
        <Header>
          <TitleBlock>
            <Title>
              {isDetailRoute
                ? 'Detalle del corte de comisiones'
                : 'Cortes y pagos de comisiones'}
            </Title>
            <Description>
              {isDetailRoute
                ? 'Revisa colaboradores, pagos y acciones del corte seleccionado.'
                : 'Agrupa comisiones por periodo, aprueba el corte y registra pagos a colaboradores.'}
            </Description>
          </TitleBlock>
          {isDetailRoute ? (
            <DetailScreenActions>
              <VmButton variant="secondary" onPress={handleBackToPeriods}>
                <ArrowLeftOutlined />
                Volver a cortes
              </VmButton>
              {exportMenu}
            </DetailScreenActions>
          ) : (
            <PeriodsToolbar>
              <HrCommissionCutRulePicker
                disabled={!businessId}
                loading={cutRulesLoading}
                pendingPeriods={pendingPeriodsForSelectedRule}
                range={selectedCutRuleRange}
                rules={activeCutRules}
                selectedPendingPeriodId={selectedPendingPeriodId}
                selectedRuleId={effectiveSelectedCutRuleId}
                onSelectPendingPeriod={(periodId) => {
                  if (periodId) setSelectedPeriodId(periodId);
                }}
                onSelect={setSelectedCutRuleId}
              />
              <VmButton
                variant="primary"
                aria-label={`Generar corte ${activeRuleMeta}`}
                isDisabled={
                  !businessId ||
                  !effectiveSelectedCutRuleId ||
                  actionKey === 'create'
                }
                onPress={() => handleAction('create')}
              >
                <SyncOutlined />
                {createActionLabel}
              </VmButton>
              {exportMenu}
            </PeriodsToolbar>
          )}
        </Header>

        {notice ? (
          <Notice status={notice.status}>
            <VmAlert.Content>
              <strong>{notice.title}</strong>
              {notice.description ? <div>{notice.description}</div> : null}
            </VmAlert.Content>
          </Notice>
        ) : null}

        {!businessId ? (
          <Notice status="warning">
            <VmAlert.Content>
              Selecciona un negocio para gestionar cortes y pagos RRHH.
            </VmAlert.Content>
          </Notice>
        ) : null}

        {error ? (
          <Notice status="danger">
            <VmAlert.Content>
              <strong>No se pudieron cargar los cortes y pagos RRHH.</strong>
              <div>{error.message}</div>
            </VmAlert.Content>
          </Notice>
        ) : null}

        {isDetailRoute && linesError ? (
          <Notice status="danger">
            <VmAlert.Content>
              <strong>No se pudieron cargar las lineas del corte.</strong>
              <div>{linesError.message}</div>
            </VmAlert.Content>
          </Notice>
        ) : null}

        {isDetailRoute && paymentsError ? (
          <Notice status="danger">
            <VmAlert.Content>
              <strong>No se pudieron cargar los pagos del corte.</strong>
              <div>{paymentsError.message}</div>
            </VmAlert.Content>
          </Notice>
        ) : null}

        {isDetailRoute && entriesError ? (
          <Notice status="danger">
            <VmAlert.Content>
              <strong>No se pudo cargar el detalle de comisiones.</strong>
              <div>{entriesError.message}</div>
            </VmAlert.Content>
          </Notice>
        ) : null}

        {cutRulesError ? (
          <Notice status="danger">
            <VmAlert.Content>
              <strong>No se pudieron cargar las reglas de corte.</strong>
              <div>{cutRulesError.message}</div>
            </VmAlert.Content>
          </Notice>
        ) : null}

        {detailNotFound ? (
          <Notice status="warning">
            <VmAlert.Content>
              <strong>No encontramos este corte.</strong>
              <div>Vuelve a cortes y abre un periodo disponible.</div>
            </VmAlert.Content>
          </Notice>
        ) : null}

        {isDetailRoute ? (
          <>
            {selectedPeriod ? operationalPanel : null}
            <HrCommissionPeriodDetailPanel
              actionKey={actionKey}
              employeeLines={employeeLines}
              lineColumns={lineColumns}
              linesLoading={linesLoading}
              payments={payments}
              paymentsLoading={paymentsLoading}
              period={selectedPeriod}
              periodDescription={detailPeriodDescription}
              periodLabel={selectedPeriodLabel}
              onAction={handleAction}
            />
          </>
        ) : (
          <>
            <OperationalPanel>
              <OperationalStack>
                <OperationalEyebrow>Corte seleccionado</OperationalEyebrow>
                <OperationalTitle>
                  <OperationalName>{selectedPeriodLabel}</OperationalName>
                  {selectedPeriod ? (
                    <StatusTag
                      $tone={getPeriodStatusTone(selectedPeriod.status)}
                    >
                      {STATUS_LABELS[selectedPeriod.status]}
                    </StatusTag>
                  ) : null}
                </OperationalTitle>
                <OperationalDescription>
                  {selectedPeriod
                    ? `${formatMoney(
                        selectedPeriodAmount,
                        selectedPeriodCurrency,
                      )} - ${getSelectedPeriodGuidance(selectedPeriod)}`
                    : getSelectedPeriodGuidance(null)}
                </OperationalDescription>
                <OperationalDescription>
                  Regla activa: {activeRuleMeta}. Proximo rango: {nextRangeMeta}
                </OperationalDescription>
              </OperationalStack>
              <WorkflowSteps aria-label="Progreso del corte seleccionado">
                {PERIOD_WORKFLOW_STEPS.map((step, index) => {
                  const state = getWorkflowStepState(selectedPeriod, index);
                  return (
                    <WorkflowStep
                      key={step.label}
                      data-active={state.active ? 'true' : undefined}
                      data-complete={state.complete ? 'true' : undefined}
                    >
                      <span>{`Paso ${index + 1}`}</span>
                      <strong>{step.label}</strong>
                    </WorkflowStep>
                  );
                })}
              </WorkflowSteps>
            </OperationalPanel>

            <SummaryGrid>
              <SummaryItem>
                <SummaryLabel>Cortes</SummaryLabel>
                <SummaryValue>{summary.periods}</SummaryValue>
                <SummaryHint>{summary.paidPeriods} pagados</SummaryHint>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Monto generado</SummaryLabel>
                <SummaryValue>
                  {formatMoney(summary.generatedAmount)}
                </SummaryValue>
                <SummaryHint>Total en cortes cargados</SummaryHint>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Pendiente</SummaryLabel>
                <SummaryValue>
                  {formatMoney(summary.pendingAmount)}
                </SummaryValue>
                <SummaryHint>
                  {summary.pendingPeriods} cortes por pagar
                </SummaryHint>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Pagado</SummaryLabel>
                <SummaryValue>{formatMoney(summary.paidAmount)}</SummaryValue>
                <SummaryHint>Soporte en la pestaña Pagos</SummaryHint>
              </SummaryItem>
            </SummaryGrid>

            <CutRulesSummary>
              <CutRulesSummaryText>
                <CutRulesSummaryTitle>
                  Configuracion de cortes
                </CutRulesSummaryTitle>
                <CutRulesSummaryMeta>
                  {activeCutRules.length
                    ? `${activeCutRules.length} activas. Usando ${activeRuleMeta}.`
                    : 'Configura una regla activa para generar cortes.'}
                </CutRulesSummaryMeta>
              </CutRulesSummaryText>
              <VmButton
                aria-haspopup="dialog"
                variant="secondary"
                isDisabled={!businessId}
                onPress={() => setCutRulesModalOpen(true)}
              >
                <SettingOutlined />
                Configurar
              </VmButton>
            </CutRulesSummary>

            <PeriodsContent>
              <HrDataTable<HrCommissionPeriodRecord>
                ariaLabel="Cortes y pagos de comisiones"
                title="Cortes del periodo"
                columns={periodColumns}
                rows={periods}
                loading={loading}
                minTableWidth={760}
                pageSize={10}
                selectedRowId={selectedPeriod?.id}
                onRowClick={handleOpenPeriodDetail}
              />
            </PeriodsContent>
          </>
        )}
      </Page>

      {paymentLine ? (
        <RecordHrPaymentModal
          key={paymentLine.id}
          actionKey={paymentActionKey}
          line={paymentLine}
          onCancel={() => setPaymentLine(null)}
          onFinish={handleRecordPayment}
        />
      ) : null}
      {adjustmentLine ? (
        <EditHrPayableAmountModal
          key={adjustmentLine.id}
          actionKey={adjustmentActionKey}
          line={adjustmentLine}
          onCancel={() => setAdjustmentLine(null)}
          onFinish={handleAdjustPayableAmount}
        />
      ) : null}
      <HrCommissionCutRulesModal
        actionKey={actionKey}
        isOpen={cutRulesModalOpen}
        loading={cutRulesLoading}
        rules={cutRules}
        onCancel={() => setCutRulesModalOpen(false)}
        onSave={handleSaveCutRule}
      />
    </>
  );
}
