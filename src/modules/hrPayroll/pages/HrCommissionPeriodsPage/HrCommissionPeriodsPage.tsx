import { Alert, Button, DatePicker, Form, Table, message } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

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
  HrPage as Page,
  HrPageHeader as Header,
  HrSummaryGrid as SummaryGrid,
  HrSummaryItem as SummaryItem,
  HrSummaryLabel as SummaryLabel,
  HrSummaryValue as SummaryValue,
  HrTableFrame as TableFrame,
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
  PeriodsToolbar,
  SideStack,
  SplitGrid,
} from './HrCommissionPeriodsPage.styles';
import {
  RecordHrPaymentModal,
  type PaymentFormValues,
} from './components/RecordHrPaymentModal';

const { RangePicker } = DatePicker;

export default function HrCommissionPeriodsPage() {
  const currentUser = useSelector(selectUser);
  const location = useLocation();
  const businessId = currentUser?.businessID ?? null;
  const [messageApi, contextHolder] = message.useMessage();
  const [paymentForm] = Form.useForm<PaymentFormValues>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [paymentLine, setPaymentLine] =
    useState<HrPayrollEmployeeLineRecord | null>(null);
  const [paymentActionKey, setPaymentActionKey] = useState<string | null>(null);
  const isPaymentsRoute = location.pathname.includes('/hr/payments');
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
          startDate: dateRange[0].toDate(),
          endDate: dateRange[1].toDate(),
        });
        setSelectedPeriodId(result.periodId);
        messageApi.success(
          action === 'create'
            ? `Corte listo: ${result.entriesCount} comisiones.`
            : `Corte ${STATUS_LABELS[result.status].toLowerCase()}.`,
        );
      } catch (actionError) {
        messageApi.error(getErrorMessage(actionError));
      } finally {
        setActionKey(null);
      }
    },
    [businessId, dateRange, messageApi],
  );

  const handleOpenPayment = useCallback((line: HrPayrollEmployeeLineRecord) => {
    paymentForm.setFieldsValue({
      paymentDate: dayjs(),
      paymentMethod:
        line.paymentMethod && line.paymentMethod !== 'other'
          ? line.paymentMethod === 'transfer'
            ? 'bank_transfer'
            : line.paymentMethod
          : 'bank_transfer',
      reference: '',
      transferReference: '',
      checkNumber: '',
      bankAccountId: '',
      cashAccountId: '',
      cashCountId: '',
    });
    setPaymentLine(line);
  }, [paymentForm]);

  const handleRecordPayment = async (values: PaymentFormValues) => {
    if (!businessId || !paymentLine) return;
    const key = `pay:${paymentLine.id}`;
    setPaymentActionKey(key);
    try {
      const result = await recordHrPayrollPayment({
        businessId,
        payrollLineId: paymentLine.id,
        amount: paymentLine.netAmount,
        paymentDate: values.paymentDate?.toDate() ?? new Date(),
        paymentMethod: values.paymentMethod,
        reference: values.reference,
        transferReference: values.transferReference,
        checkNumber: values.checkNumber,
        bankAccountId: values.bankAccountId,
        cashAccountId: values.cashAccountId,
        cashCountId: values.cashCountId,
      });
      messageApi.success(
        result.reused ? 'Pago ya registrado.' : 'Pago de nomina registrado.',
      );
      setPaymentLine(null);
      paymentForm.resetFields();
    } catch (paymentError) {
      messageApi.error(getErrorMessage(paymentError));
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
  return (
    <>
      {contextHolder}
      <MenuApp sectionName={isPaymentsRoute ? 'Pagos RRHH' : 'Cortes RRHH'} />
      <Page>
        <Header>
          <TitleBlock>
            <Title>
              {isPaymentsRoute ? 'Pagos de comisiones' : 'Cortes de comisiones'}
            </Title>
            <Description>
              {isPaymentsRoute
                ? 'Confirma pagos de colaboradores y revisa la trazabilidad de caja, banco y contabilidad.'
                : 'Agrupa comisiones calculadas por colaborador y aprueba la corrida antes del pago.'}
            </Description>
          </TitleBlock>
          <PeriodsToolbar>
            <RangePicker
              value={dateRange}
              onChange={(range) => {
                if (!range?.[0] || !range?.[1]) return;
                setDateRange([range[0], range[1]]);
              }}
              style={{ width: '100%' }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={actionKey === 'create'}
              onClick={() => handleAction('create')}
            >
              Crear corte
            </Button>
          </PeriodsToolbar>
        </Header>

        {!businessId ? (
          <Alert
            type="warning"
            showIcon
            message="Selecciona un negocio para gestionar cortes RRHH."
          />
        ) : null}

        {error ? (
          <Alert
            type="error"
            showIcon
            message="No se pudieron cargar los cortes RRHH."
            description={error.message}
          />
        ) : null}

        {linesError ? (
          <Alert
            type="error"
            showIcon
            message="No se pudieron cargar las lineas del corte."
            description={linesError.message}
          />
        ) : null}

        {paymentsError ? (
          <Alert
            type="error"
            showIcon
            message="No se pudieron cargar los pagos del corte."
            description={paymentsError.message}
          />
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

        <SplitGrid>
          <TableFrame>
            <Table<HrCommissionPeriodRecord>
              columns={periodColumns}
              dataSource={periods}
              loading={loading}
              rowKey="id"
              scroll={{ x: 980 }}
              rowClassName={(period) =>
                period.id === selectedPeriod?.id ? 'ant-table-row-selected' : ''
              }
              onRow={(period) => ({
                onClick: () => setSelectedPeriodId(period.id),
              })}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
            />
          </TableFrame>

          <SideStack>
            <TableFrame>
              <Table<HrPayrollEmployeeLineRecord>
                columns={lineColumns}
                dataSource={employeeLines}
                loading={linesLoading}
                rowKey="id"
                scroll={{ x: 620 }}
                title={() => 'Lineas por colaborador'}
                locale={{
                  emptyText: selectedPeriod
                    ? 'Sin lineas para este corte'
                    : 'Selecciona un corte',
                }}
                pagination={{
                  pageSize: 8,
                  showSizeChanger: false,
                }}
              />
            </TableFrame>

            <TableFrame>
              <Table<HrEmployeePaymentRecord>
                columns={paymentColumns}
                dataSource={payments}
                loading={paymentsLoading}
                rowKey="id"
                scroll={{ x: 520 }}
                title={() => 'Pagos registrados'}
                locale={{
                  emptyText: selectedPeriod
                    ? 'Sin pagos para este corte'
                    : 'Selecciona un corte',
                }}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: false,
                }}
              />
            </TableFrame>
          </SideStack>
        </SplitGrid>
      </Page>

      <RecordHrPaymentModal
        actionKey={paymentActionKey}
        form={paymentForm}
        line={paymentLine}
        onCancel={() => {
          setPaymentLine(null);
          paymentForm.resetFields();
        }}
        onFinish={handleRecordPayment}
        onSubmit={() => paymentForm.submit()}
      />
    </>
  );
}
