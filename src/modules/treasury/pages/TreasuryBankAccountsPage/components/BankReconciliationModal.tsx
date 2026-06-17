import { useEffect, useMemo, useState } from 'react';
import { Alert, Form, Input, InputNumber, Modal, Select } from 'antd';
import { DateTime } from 'luxon';

import DatePicker from '@/components/DatePicker';
import type { BankAccount } from '@/types/accounting';
import type { BankReconciliationDraft } from '@/modules/treasury/utils/records';
import { formatMoney } from '@/modules/treasury/utils/formatters';
import { fbPreviewBankReconciliation } from '../../../repositories/fbCreateBankReconciliation';

interface BankReconciliationModalProps {
  bankAccounts: BankAccount[];
  currentBalancesByAccountId: Record<string, number>;
  defaultBankAccountId?: string | null;
  open: boolean;
  onCancel: () => void;
  onSubmit: (draft: BankReconciliationDraft) => Promise<void>;
  submitting?: boolean;
}

interface BankReconciliationFormValues {
  bankAccountId: string;
  notes?: string;
  openingStatementBalance: number;
  periodStart?: DateTime;
  reference?: string;
  statementBalance: number;
  statementDate?: DateTime;
}

interface ReconciliationPreviewState {
  error: string | null;
  carriedMovementCount: number | null;
  ledgerBalance: number | null;
  ledgerOpeningBalance: number | null;
  ledgerPeriodMovementTotal: number | null;
  loading: boolean;
  openingVariance: number | null;
  periodMovementCount: number | null;
  periodVariance: number | null;
  reconciledMovementCount: number | null;
  requestKey: string | null;
  status: 'balanced' | 'variance' | null;
  statementMovementTotal: number | null;
  unreconciledMovementCount: number | null;
  variance: number | null;
}

interface ReconciliationPreviewRequest {
  bankAccountId: string;
  businessId: string;
  openingStatementBalance: number;
  periodStart: number;
  requestKey: string;
  statementBalance: number;
  statementDate: number;
}

const EMPTY_PREVIEW_STATE: ReconciliationPreviewState = {
  error: null,
  carriedMovementCount: null,
  ledgerBalance: null,
  ledgerOpeningBalance: null,
  ledgerPeriodMovementTotal: null,
  loading: false,
  openingVariance: null,
  periodMovementCount: null,
  periodVariance: null,
  reconciledMovementCount: null,
  requestKey: null,
  status: null,
  statementMovementTotal: null,
  unreconciledMovementCount: null,
  variance: null,
};

export const BankReconciliationModal = ({
  bankAccounts,
  currentBalancesByAccountId,
  defaultBankAccountId,
  open,
  onCancel,
  onSubmit,
  submitting = false,
}: BankReconciliationModalProps) => {
  const [form] = Form.useForm<BankReconciliationFormValues>();
  const [previewRequest, setPreviewRequest] =
    useState<ReconciliationPreviewRequest | null>(null);
  const [previewState, setPreviewState] =
    useState<ReconciliationPreviewState>(EMPTY_PREVIEW_STATE);

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    form.setFieldsValue({
      bankAccountId: defaultBankAccountId ?? undefined,
      periodStart: DateTime.now().startOf('month'),
      statementDate: DateTime.now(),
    });
  }, [defaultBankAccountId, form, open]);

  const bankOptions = useMemo(
    () =>
      bankAccounts
        .filter((account) => account.status === 'active')
        .map((account) => ({
          label: account.name,
          value: account.id,
        })),
    [bankAccounts],
  );

  const selectedBankAccountId = Form.useWatch('bankAccountId', form);
  const selectedBankAccount =
    bankAccounts.find((account) => account.id === selectedBankAccountId) ??
    null;
  const openingStatementBalanceInput = Form.useWatch(
    'openingStatementBalance',
    form,
  );
  const periodStartInput = Form.useWatch('periodStart', form);
  const statementBalanceInput = Form.useWatch('statementBalance', form);
  const statementDateInput = Form.useWatch('statementDate', form);
  const fallbackLedgerBalance = selectedBankAccountId
    ? (currentBalancesByAccountId[selectedBankAccountId] ?? 0)
    : 0;
  const openingStatementBalance = Number(openingStatementBalanceInput);
  const statementBalance = Number(statementBalanceInput);
  const hasOpeningStatementBalance = Number.isFinite(openingStatementBalance);
  const hasStatementBalance = Number.isFinite(statementBalance);
  const currentPreviewKey =
    open &&
    selectedBankAccountId &&
    hasOpeningStatementBalance &&
    hasStatementBalance &&
    periodStartInput?.toMillis?.() &&
    statementDateInput?.toMillis?.()
      ? [
          selectedBankAccountId,
          selectedBankAccount?.businessId ?? '',
          openingStatementBalance.toFixed(2),
          periodStartInput?.toMillis?.() ?? '',
          statementBalance.toFixed(2),
          statementDateInput?.toMillis?.() ?? '',
        ].join(':')
      : null;
  const hasFreshPreview = previewState.requestKey === currentPreviewKey;
  const visiblePreviewState = hasFreshPreview
    ? previewState
    : EMPTY_PREVIEW_STATE;
  const expectedLedgerBalance =
    visiblePreviewState.ledgerBalance ?? fallbackLedgerBalance;
  const ledgerOpeningBalance = visiblePreviewState.ledgerOpeningBalance;
  const ledgerPeriodMovementTotal =
    visiblePreviewState.ledgerPeriodMovementTotal;
  const statementMovementTotal = visiblePreviewState.statementMovementTotal;
  const openingVariance = visiblePreviewState.openingVariance;
  const periodVariance = visiblePreviewState.periodVariance;
  const variance = visiblePreviewState.variance;
  const reconciliationStatus = visiblePreviewState.status;
  const formatSelectedMoney = (amount: number) =>
    formatMoney(amount, selectedBankAccount?.currency ?? 'DOP');

  useEffect(() => {
    if (!previewRequest) return;
    let active = true;

    void fbPreviewBankReconciliation({
      bankAccountId: previewRequest.bankAccountId,
      businessId: previewRequest.businessId,
      openingStatementBalance: previewRequest.openingStatementBalance,
      periodStart: previewRequest.periodStart,
      statementBalance: previewRequest.statementBalance,
      statementDate: previewRequest.statementDate,
    })
      .then((response) => {
        if (!active) return;
        setPreviewState({
          carriedMovementCount: Number(
            response.preview.carriedMovementCount ?? 0,
          ),
          error: null,
          ledgerBalance: Number(response.preview.ledgerBalance ?? 0),
          ledgerOpeningBalance: Number(
            response.preview.ledgerOpeningBalance ?? 0,
          ),
          ledgerPeriodMovementTotal: Number(
            response.preview.ledgerPeriodMovementTotal ?? 0,
          ),
          loading: false,
          openingVariance: Number(response.preview.openingVariance ?? 0),
          periodMovementCount: Number(
            response.preview.periodMovementCount ?? 0,
          ),
          periodVariance: Number(response.preview.periodVariance ?? 0),
          reconciledMovementCount: Number(
            response.preview.reconciledMovementCount ?? 0,
          ),
          requestKey: previewRequest.requestKey,
          status: response.preview.status ?? null,
          statementMovementTotal: Number(
            response.preview.statementMovementTotal ?? 0,
          ),
          unreconciledMovementCount: Number(
            response.preview.unreconciledMovementCount ?? 0,
          ),
          variance: Number(response.preview.variance ?? 0),
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const messageText =
          typeof error === 'object' &&
          error &&
          'message' in error &&
          typeof error.message === 'string'
            ? error.message
            : 'No se pudo calcular la previsualización de conciliación.';
        setPreviewState({
          carriedMovementCount: null,
          error: messageText,
          ledgerBalance: null,
          ledgerOpeningBalance: null,
          ledgerPeriodMovementTotal: null,
          loading: false,
          openingVariance: null,
          periodMovementCount: null,
          periodVariance: null,
          reconciledMovementCount: null,
          requestKey: previewRequest.requestKey,
          status: null,
          statementMovementTotal: null,
          unreconciledMovementCount: null,
          variance: null,
        });
      });

    return () => {
      active = false;
    };
  }, [previewRequest]);

  const handleValuesChange = (
    _changedValues: Partial<BankReconciliationFormValues>,
    allValues: BankReconciliationFormValues,
  ) => {
    const nextStatementBalance = Number(allValues.statementBalance);
    const nextOpeningStatementBalance = Number(
      allValues.openingStatementBalance,
    );
    const nextPeriodStart =
      allValues.periodStart?.toJSDate?.() ?? allValues.periodStart ?? null;
    const nextStatementDate =
      allValues.statementDate?.toJSDate?.() ?? allValues.statementDate ?? null;
    const nextBusinessId =
      bankAccounts.find((account) => account.id === allValues.bankAccountId)
        ?.businessId ?? '';

    if (
      !allValues.bankAccountId ||
      !Number.isFinite(nextOpeningStatementBalance) ||
      !Number.isFinite(nextStatementBalance) ||
      !(nextPeriodStart instanceof Date) ||
      !(nextStatementDate instanceof Date)
    ) {
      setPreviewRequest(null);
      setPreviewState(EMPTY_PREVIEW_STATE);
      return;
    }

    const requestKey = [
      allValues.bankAccountId,
      nextBusinessId,
      nextOpeningStatementBalance.toFixed(2),
      allValues.periodStart?.toMillis?.() ?? '',
      nextStatementBalance.toFixed(2),
      allValues.statementDate?.toMillis?.() ?? '',
    ].join(':');

    setPreviewState({
      carriedMovementCount: null,
      error: null,
      ledgerBalance: null,
      ledgerOpeningBalance: null,
      ledgerPeriodMovementTotal: null,
      loading: true,
      openingVariance: null,
      periodMovementCount: null,
      periodVariance: null,
      reconciledMovementCount: null,
      requestKey,
      status: null,
      statementMovementTotal: null,
      unreconciledMovementCount: null,
      variance: null,
    });
    setPreviewRequest({
      bankAccountId: allValues.bankAccountId,
      businessId: nextBusinessId,
      openingStatementBalance: nextOpeningStatementBalance,
      periodStart: nextPeriodStart.getTime(),
      requestKey,
      statementBalance: nextStatementBalance,
      statementDate: nextStatementDate.getTime(),
    });
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const periodStart =
      values.periodStart?.toJSDate?.() ?? values.periodStart ?? null;
    const statementDate =
      values.statementDate?.toJSDate?.() ?? values.statementDate ?? null;

    if (
      periodStart instanceof Date &&
      statementDate instanceof Date &&
      periodStart.getTime() > statementDate.getTime()
    ) {
      form.setFields([
        {
          name: 'statementDate',
          errors: ['La fecha final no puede ser anterior al inicio.'],
        },
      ]);
      return;
    }

    await onSubmit({
      bankAccountId: values.bankAccountId,
      openingStatementBalance: values.openingStatementBalance,
      periodStart,
      statementBalance: values.statementBalance,
      statementDate,
      notes: values.notes?.trim() || null,
      reference: values.reference?.trim() || null,
    });
  };

  return (
    <Modal
      destroyOnClose
      title="Conciliación bancaria"
      open={open}
      okText="Guardar"
      cancelText="Cancelar"
      closable={!submitting}
      confirmLoading={submitting}
      keyboard={!submitting}
      mask={{ closable: false }}
      cancelButtonProps={{ disabled: submitting }}
      afterOpenChange={(isOpen) => {
        if (!isOpen) return;
        setPreviewRequest(null);
        setPreviewState(EMPTY_PREVIEW_STATE);
      }}
      onCancel={() => {
        if (submitting) return;
        setPreviewRequest(null);
        setPreviewState(EMPTY_PREVIEW_STATE);
        onCancel();
      }}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <Form.Item
          label="Cuenta bancaria"
          name="bankAccountId"
          rules={[
            { required: true, message: 'Seleccione la cuenta bancaria.' },
          ]}
        >
          <Select
            disabled={submitting}
            options={bankOptions}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="Inicio del periodo"
          name="periodStart"
          rules={[
            { required: true, message: 'Seleccione el inicio del periodo.' },
          ]}
        >
          <DatePicker
            disabled={submitting}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
          />
        </Form.Item>

        <Form.Item
          label="Balance inicial del estado"
          name="openingStatementBalance"
          rules={[
            {
              required: true,
              message: 'Ingrese el balance inicial del banco.',
            },
          ]}
        >
          <InputNumber
            disabled={submitting}
            style={{ width: '100%' }}
            step={0.01}
            precision={2}
            placeholder="0.00"
            addonBefore="$"
          />
        </Form.Item>

        <Form.Item
          label="Fecha final del estado"
          name="statementDate"
          rules={[
            {
              required: true,
              message: 'Seleccione la fecha final del estado.',
            },
          ]}
        >
          <DatePicker
            disabled={submitting}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
          />
        </Form.Item>

        <Form.Item
          label="Balance final del estado"
          name="statementBalance"
          rules={[
            { required: true, message: 'Ingrese el balance final del banco.' },
          ]}
        >
          <InputNumber
            disabled={submitting}
            style={{ width: '100%' }}
            step={0.01}
            precision={2}
            placeholder="0.00"
            addonBefore="$"
          />
        </Form.Item>

        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message={`Balance ledger final: ${formatSelectedMoney(expectedLedgerBalance)}`}
          description={
            visiblePreviewState.loading
              ? 'Calculando desde backend...'
              : `Periodo backend usando cashMovements. ${visiblePreviewState.periodMovementCount ?? visiblePreviewState.reconciledMovementCount ?? 0} movimiento(s) del periodo, ${visiblePreviewState.carriedMovementCount ?? 0} arrastrado(s), ${visiblePreviewState.unreconciledMovementCount ?? 0} posterior(es).`
          }
        />

        {visiblePreviewState.error ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message="No se pudo calcular la previsualización"
            description={visiblePreviewState.error}
          />
        ) : null}

        {reconciliationStatus ? (
          <Alert
            style={{ marginBottom: 16 }}
            type={reconciliationStatus === 'balanced' ? 'success' : 'warning'}
            showIcon
            message={
              reconciliationStatus === 'balanced'
                ? 'Balance conciliado'
                : 'Diferencia detectada'
            }
            description={
              variance === 0
                ? 'El balance del estado de cuenta coincide con el ledger.'
                : `Diferencia final: ${formatSelectedMoney(variance ?? 0)}`
            }
          />
        ) : null}

        {reconciliationStatus ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message="Detalle del periodo"
            description={[
              `Inicial ledger: ${formatSelectedMoney(ledgerOpeningBalance ?? 0)}`,
              `Movimiento banco: ${formatSelectedMoney(statementMovementTotal ?? 0)}`,
              `Movimiento ledger: ${formatSelectedMoney(ledgerPeriodMovementTotal ?? 0)}`,
              `Variación inicial: ${formatSelectedMoney(openingVariance ?? 0)}`,
              `Variación periodo: ${formatSelectedMoney(periodVariance ?? 0)}`,
            ].join(' · ')}
          />
        ) : null}

        <Form.Item label="Referencia" name="reference">
          <Input
            disabled={submitting}
            placeholder="Estado abril, corte semanal..."
            maxLength={80}
          />
        </Form.Item>

        <Form.Item label="Notas" name="notes">
          <Input.TextArea
            disabled={submitting}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
