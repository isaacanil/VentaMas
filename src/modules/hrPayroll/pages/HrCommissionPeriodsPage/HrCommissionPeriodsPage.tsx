import { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import { useSelector } from 'react-redux';

import { VmAlert, VmButton, VmDropdown, VmTabs } from '@/components/heroui';
import {
  DownOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SyncOutlined,
} from '@/constants/icons/antd';
import {
  adjustHrPayrollLinePayable,
  deactivateHrCommissionCutRule,
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
  HrSummaryGrid as SummaryGrid,
  HrSummaryItem as SummaryItem,
  HrSummaryLabel as SummaryLabel,
  HrSummaryValue as SummaryValue,
  HrTitle as Title,
  HrTitleBlock as TitleBlock,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import {
  formatHrMoney as formatMoney,
  HR_COMMISSION_PERIOD_STATUS_LABELS as STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import type {
  HrCommissionCutRuleInput,
  HrCommissionCutRuleRecord,
  HrEmployeePaymentRecord,
  HrCommissionPeriodRecord,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';
import {
  buildLineColumns,
  buildPeriodColumns,
  paymentColumns,
} from './HrCommissionPeriodsPage.columns';
import { getErrorMessage } from './HrCommissionPeriodsPage.helpers';
import {
  DetailDescription,
  DetailEmptyState,
  DetailEmptyText,
  DetailEmptyTitle,
  DetailHeader,
  DetailHeadingStack,
  DetailPanelContent,
  DetailSection,
  DetailTabs,
  DetailTitle,
  PeriodsContent,
  PeriodsToolbar,
} from './HrCommissionPeriodsPage.styles';
import {
  EditHrPayableAmountModal,
  type PayableAmountFormValues,
} from './components/EditHrPayableAmountModal';
import {
  RecordHrPaymentModal,
  type PaymentFormValues,
} from './components/RecordHrPaymentModal';
import { PeriodActionButtons } from './components/PeriodActionButtons';
import { HrCommissionCutRulePicker } from './components/HrCommissionCutRulePicker/HrCommissionCutRulePicker';
import { HrCommissionCutRulesPanel } from './components/HrCommissionCutRulesPanel/HrCommissionCutRulesPanel';
import { resolveNextHrCommissionCutRuleRange } from './utils/hrCommissionCutRules';
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
  const businessId = currentUser?.businessID ?? null;
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [selectedCutRuleId, setSelectedCutRuleId] = useState<string | null>(
    null,
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
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
  const selectedPeriod =
    periods.find((period) => period.id === selectedPeriodId) ??
    periods[0] ??
    null;
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
      amount: periods.reduce(
        (sum, period) => sum + getPeriodPayableAmount(period),
        0,
      ),
      approved: periods.filter((period) => period.status === 'approved').length,
      pending: periods.filter((period) =>
        ['approved', 'partially_paid'].includes(period.status),
      ).length,
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

  const handleSetCutRuleActive = useCallback(
    async (rule: HrCommissionCutRuleRecord, active: boolean) => {
      if (!businessId) return false;

      const key = `cut-rule:active:${rule.id}`;
      setActionKey(key);
      try {
        if (active) {
          const result = await saveHrCommissionCutRule({
            businessId,
            rule: { ...rule, active: true },
          });
          setSelectedCutRuleId(result.ruleId);
        } else {
          await deactivateHrCommissionCutRule({
            businessId,
            ruleId: rule.id,
          });
          if (effectiveSelectedCutRuleId === rule.id) {
            setSelectedCutRuleId(null);
          }
        }
        setNotice({
          status: 'success',
          title: active
            ? 'Regla de corte reactivada.'
            : 'Regla de corte desactivada.',
        });
        return true;
      } catch (ruleError) {
        setNotice({
          status: 'danger',
          title: 'No se pudo actualizar la regla.',
          description: getErrorMessage(ruleError),
        });
        return false;
      } finally {
        setActionKey(null);
      }
    },
    [businessId, effectiveSelectedCutRuleId],
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

  const periodColumns = useMemo(
    () =>
      buildPeriodColumns({
        actionKey,
        onAction: handleAction,
      }),
    [actionKey, handleAction],
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
    selectedPeriod?.label || selectedPeriod?.periodKey || 'Corte seleccionado';
  return (
    <>
      <MenuApp sectionName="Cortes y pagos RRHH" />
      <Page>
        <Header>
          <TitleBlock>
            <Title>Cortes y pagos de comisiones</Title>
            <Description>
              Agrupa comisiones por periodo, aprueba el corte y registra pagos a
              colaboradores.
            </Description>
          </TitleBlock>
          <PeriodsToolbar>
            <HrCommissionCutRulePicker
              disabled={!businessId}
              loading={cutRulesLoading}
              range={selectedCutRuleRange}
              rules={activeCutRules}
              selectedRuleId={effectiveSelectedCutRuleId}
              onSelect={setSelectedCutRuleId}
            />
            <VmButton
              variant="secondary"
              isDisabled={
                !businessId ||
                loading ||
                linesLoading ||
                paymentsLoading ||
                exporting ||
                periods.length === 0
              }
              onPress={() => void handleExportExcel()}
            >
              <FileExcelOutlined />
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </VmButton>
            <VmDropdown>
              <VmDropdown.Button
                aria-label="Exportar corte a PDF"
                isDisabled={
                  !businessId ||
                  loading ||
                  linesLoading ||
                  entriesLoading ||
                  exporting ||
                  Boolean(exportingPdfMode) ||
                  periods.length === 0
                }
              >
                <FilePdfOutlined />
                {exportingPdfMode ? 'Exportando PDF...' : 'Exportar PDF'}
                <DownOutlined />
              </VmDropdown.Button>
              <VmDropdown.Popover placement="bottom end">
                <VmDropdown.Menu
                  aria-label="Opciones de PDF del corte"
                  onAction={(key) =>
                    void handleExportPdf(key as HrCommissionPeriodsPdfMode)
                  }
                >
                  <VmDropdown.Item id="general" textValue="Resumen general">
                    <InlineStack>
                      <FilePdfOutlined />
                      <span>Resumen general</span>
                    </InlineStack>
                  </VmDropdown.Item>
                  <VmDropdown.Item id="detail" textValue="Detalle por empleado">
                    <InlineStack>
                      <FilePdfOutlined />
                      <span>Detalle por empleado</span>
                    </InlineStack>
                  </VmDropdown.Item>
                </VmDropdown.Menu>
              </VmDropdown.Popover>
            </VmDropdown>
            <VmButton
              variant="primary"
              isDisabled={
                !businessId ||
                !effectiveSelectedCutRuleId ||
                actionKey === 'create'
              }
              onPress={() => handleAction('create')}
            >
              <SyncOutlined />
              {actionKey === 'create' ? 'Generando...' : 'Generar/Actualizar'}
            </VmButton>
          </PeriodsToolbar>
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

        {linesError ? (
          <Notice status="danger">
            <VmAlert.Content>
              <strong>No se pudieron cargar las lineas del corte.</strong>
              <div>{linesError.message}</div>
            </VmAlert.Content>
          </Notice>
        ) : null}

        {paymentsError ? (
          <Notice status="danger">
            <VmAlert.Content>
              <strong>No se pudieron cargar los pagos del corte.</strong>
              <div>{paymentsError.message}</div>
            </VmAlert.Content>
          </Notice>
        ) : null}

        {entriesError ? (
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

        <SummaryGrid>
          <SummaryItem>
            <SummaryLabel>Cortes</SummaryLabel>
            <SummaryValue>{summary.periods}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Total reciente</SummaryLabel>
            <SummaryValue>{formatMoney(summary.amount)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Aprobados</SummaryLabel>
            <SummaryValue>{summary.approved}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Por pagar</SummaryLabel>
            <SummaryValue>{summary.pending}</SummaryValue>
          </SummaryItem>
        </SummaryGrid>

        <HrCommissionCutRulesPanel
          actionKey={actionKey}
          loading={cutRulesLoading}
          rules={cutRules}
          onSave={handleSaveCutRule}
          onSetActive={handleSetCutRuleActive}
        />

        <PeriodsContent>
          <HrDataTable<HrCommissionPeriodRecord>
            ariaLabel="Cortes y pagos de comisiones"
            title="Cortes del periodo"
            columns={periodColumns}
            rows={periods}
            loading={loading}
            minTableWidth={920}
            pageSize={10}
            selectedRowId={selectedPeriod?.id}
            onRowClick={(period) => setSelectedPeriodId(period.id)}
          />

          <DetailSection>
            <DetailHeader>
              <DetailHeadingStack>
                <DetailTitle>Detalle del corte seleccionado</DetailTitle>
                {selectedPeriod ? (
                  <DetailDescription>
                    {`${selectedPeriodLabel} - ${formatMoney(
                      getPeriodPayableAmount(selectedPeriod),
                      selectedPeriod.currency,
                    )}`}
                  </DetailDescription>
                ) : null}
              </DetailHeadingStack>
              {selectedPeriod ? (
                <PeriodActionButtons
                  actionKey={actionKey}
                  layout="toolbar"
                  period={selectedPeriod}
                  onAction={handleAction}
                />
              ) : null}
            </DetailHeader>

            {selectedPeriod ? (
              <DetailTabs defaultSelectedKey="collaborators">
                <VmTabs.ListContainer>
                  <VmTabs.List aria-label="Detalle del corte seleccionado">
                    <VmTabs.Tab id="collaborators">
                      <VmTabs.Indicator />
                      Colaboradores ({employeeLines.length})
                    </VmTabs.Tab>
                    <VmTabs.Tab id="payments">
                      <VmTabs.Indicator />
                      Pagos ({payments.length})
                    </VmTabs.Tab>
                  </VmTabs.List>
                </VmTabs.ListContainer>

                <VmTabs.Panel id="collaborators">
                  <DetailPanelContent>
                    <HrDataTable<HrPayrollEmployeeLineRecord>
                      ariaLabel="Lineas por colaborador"
                      columns={lineColumns}
                      rows={employeeLines}
                      loading={linesLoading}
                      emptyText="Sin lineas para este corte"
                      minTableWidth={860}
                      pageSize={8}
                    />
                  </DetailPanelContent>
                </VmTabs.Panel>

                <VmTabs.Panel id="payments">
                  <DetailPanelContent>
                    <HrDataTable<HrEmployeePaymentRecord>
                      ariaLabel="Pagos registrados"
                      columns={paymentColumns}
                      rows={payments}
                      loading={paymentsLoading}
                      emptyText="Sin pagos para este corte"
                      minTableWidth={560}
                      pageSize={5}
                    />
                  </DetailPanelContent>
                </VmTabs.Panel>
              </DetailTabs>
            ) : (
              <DetailEmptyState>
                <DetailEmptyTitle>Sin corte seleccionado</DetailEmptyTitle>
                <DetailEmptyText>
                  Crea un corte del periodo para revisar colaboradores y pagos.
                </DetailEmptyText>
              </DetailEmptyState>
            )}
          </DetailSection>
        </PeriodsContent>
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
    </>
  );
}
