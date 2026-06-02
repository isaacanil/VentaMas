import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { VmAlert, VmButton, VmTabs } from '@/components/heroui';
import { PlusOutlined } from '@/constants/icons/antd';
import {
  manageHrCommissionPeriod,
  recordHrPayrollPayment,
  useHrEmployeePayments,
  useHrCommissionPeriods,
  useHrPayrollEmployeeLines,
} from '@/firebase/hrPayroll/useHrCommissionPeriods';
import { selectUser } from '@/features/auth/userSlice';
import {
  HrDescription as Description,
  HrDataTable,
  HrDateRangeField,
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
  DetailPanelContent,
  DetailSection,
  DetailTabs,
  DetailTitle,
  PeriodsContent,
  PeriodsToolbar,
} from './HrCommissionPeriodsPage.styles';
import {
  RecordHrPaymentModal,
  type PaymentFormValues,
} from './components/RecordHrPaymentModal';

type NoticeState = {
  description?: string;
  status: 'success' | 'danger';
  title: string;
};

const getDefaultDateRange = (): [Date, Date] => {
  const now = new Date();
  return [
    new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
  ];
};

export default function HrCommissionPeriodsPage() {
  const currentUser = useSelector(selectUser);
  const businessId = currentUser?.businessID ?? null;
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [dateRange, setDateRange] = useState<[Date, Date]>(getDefaultDateRange);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [paymentLine, setPaymentLine] =
    useState<HrPayrollEmployeeLineRecord | null>(null);
  const [paymentActionKey, setPaymentActionKey] = useState<string | null>(null);
  const {
    rows: periods,
    loading,
    error,
  } = useHrCommissionPeriods({
    businessId,
  });
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
        (sum, period) => sum + period.totalCommissionAmount,
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
    async (
      action: 'create' | 'close' | 'approve',
      period?: HrCommissionPeriodRecord,
    ) => {
      if (!businessId) return;
      const key =
        action === 'create' ? 'create' : `${action}:${period?.id ?? 'none'}`;
      setActionKey(key);
      try {
        const result = await manageHrCommissionPeriod({
          action,
          businessId,
          periodId: period?.id,
          startDate: dateRange[0],
          endDate: dateRange[1],
        });
        setSelectedPeriodId(result.periodId);
        setNotice({
          status: 'success',
          title:
            action === 'create'
              ? `Corte listo: ${result.entriesCount} comisiones.`
              : `Corte ${STATUS_LABELS[result.status].toLowerCase()}.`,
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
    [businessId, dateRange],
  );

  const handleOpenPayment = useCallback((line: HrPayrollEmployeeLineRecord) => {
    setPaymentLine(line);
  }, []);

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
        paymentActionKey,
        onOpenPayment: handleOpenPayment,
      }),
    [handleOpenPayment, paymentActionKey],
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
              Agrupa comisiones por periodo, aprueba el corte y registra pagos
              a colaboradores.
            </Description>
          </TitleBlock>
          <PeriodsToolbar>
            <HrDateRangeField
              ariaLabel="Rango de cortes y pagos RRHH"
              value={dateRange}
              onChange={setDateRange}
            />
            <VmButton
              variant="primary"
              isDisabled={actionKey === 'create'}
              onPress={() => handleAction('create')}
            >
              <PlusOutlined />
              {actionKey === 'create' ? 'Creando...' : 'Crear corte'}
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
              <DetailTitle>Detalle del corte seleccionado</DetailTitle>
              {selectedPeriod ? (
                <DetailDescription>
                  {`${selectedPeriodLabel} - ${formatMoney(
                      selectedPeriod.totalCommissionAmount,
                      selectedPeriod.currency,
                    )}`}
                </DetailDescription>
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
                      minTableWidth={760}
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
    </>
  );
}
