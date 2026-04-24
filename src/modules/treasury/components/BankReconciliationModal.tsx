import { useEffect, useMemo, useState } from 'react';
import { Alert, Form, Input, InputNumber, Modal, Select } from 'antd';
import { DateTime } from 'luxon';

import DatePicker from '@/components/DatePicker';
import { fbPreviewBankReconciliation } from '@/firebase/treasury/fbCreateBankReconciliation';
import type { BankAccount } from '@/types/accounting';
import type { BankReconciliationDraft } from '@/modules/treasury/utils/records';

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
  reference?: string;
  statementBalance: number;
  statementDate?: DateTime;
}

interface ReconciliationPreviewState {
  error: string | null;
  ledgerBalance: number | null;
  loading: boolean;
  reconciledMovementCount: number | null;
  requestKey: string | null;
  status: 'balanced' | 'variance' | null;
  unreconciledMovementCount: number | null;
  variance: number | null;
}

interface ReconciliationPreviewRequest {
  bankAccountId: string;
  businessId: string;
  requestKey: string;
  statementBalance: number;
  statementDate: number | null;
}

const EMPTY_PREVIEW_STATE: ReconciliationPreviewState = {
  error: null,
  ledgerBalance: null,
  loading: false,
  reconciledMovementCount: null,
  requestKey: null,
  status: null,
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
    bankAccounts.find((account) => account.id === selectedBankAccountId) ?? null;
  const statementBalanceInput = Form.useWatch('statementBalance', form);
  const statementDateInput = Form.useWatch('statementDate', form);
  const fallbackLedgerBalance = selectedBankAccountId
    ? currentBalancesByAccountId[selectedBankAccountId] ?? 0
    : 0;
  const statementBalance = Number(statementBalanceInput);
  const hasStatementBalance = Number.isFinite(statementBalance);
  const currentPreviewKey =
    open && selectedBankAccountId && hasStatementBalance
      ? [
          selectedBankAccountId,
          selectedBankAccount?.businessId ?? '',
          statementBalance.toFixed(2),
          statementDateInput?.toMillis?.() ?? '',
        ].join(':')
      : null;
  const hasFreshPreview = previewState.requestKey === currentPreviewKey;
  const visiblePreviewState = hasFreshPreview ? previewState : EMPTY_PREVIEW_STATE;
  const expectedLedgerBalance =
    visiblePreviewState.ledgerBalance ?? fallbackLedgerBalance;
  const variance = visiblePreviewState.variance;
  const reconciliationStatus = visiblePreviewState.status;

  useEffect(() => {
    if (!previewRequest) return;
    let active = true;

    void fbPreviewBankReconciliation({
      bankAccountId: previewRequest.bankAccountId,
      businessId: previewRequest.businessId,
      statementBalance: previewRequest.statementBalance,
      statementDate: previewRequest.statementDate,
    })
      .then((response) => {
        if (!active) return;
        setPreviewState({
          error: null,
          ledgerBalance: Number(response.preview.ledgerBalance ?? 0),
          loading: false,
          reconciledMovementCount: Number(
            response.preview.reconciledMovementCount ?? 0,
          ),
          requestKey: previewRequest.requestKey,
          status: response.preview.status ?? null,
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
          error: messageText,
          ledgerBalance: null,
          loading: false,
          reconciledMovementCount: null,
          requestKey: previewRequest.requestKey,
          status: null,
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
    const nextStatementDate =
      allValues.statementDate?.toJSDate?.() ?? allValues.statementDate ?? null;
    const nextBusinessId =
      bankAccounts.find((account) => account.id === allValues.bankAccountId)
        ?.businessId ?? '';

    if (!allValues.bankAccountId || !Number.isFinite(nextStatementBalance)) {
      setPreviewRequest(null);
      setPreviewState(EMPTY_PREVIEW_STATE);
      return;
    }

    const requestKey = [
      allValues.bankAccountId,
      nextBusinessId,
      nextStatementBalance.toFixed(2),
      allValues.statementDate?.toMillis?.() ?? '',
    ].join(':');

    setPreviewState({
      error: null,
      ledgerBalance: null,
      loading: true,
      requestKey,
      status: null,
      variance: null,
    });
    setPreviewRequest({
      bankAccountId: allValues.bankAccountId,
      businessId: nextBusinessId,
      requestKey,
      statementBalance: nextStatementBalance,
      statementDate:
        nextStatementDate instanceof Date ? nextStatementDate.getTime() : null,
    });
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit({
      bankAccountId: values.bankAccountId,
      statementBalance: values.statementBalance,
      statementDate:
        values.statementDate?.toJSDate?.() ?? values.statementDate ?? null,
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
      maskClosable={false}
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
          rules={[{ required: true, message: 'Seleccione la cuenta bancaria.' }]}
        >
          <Select
            disabled={submitting}
            options={bankOptions}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message={`Balance ledger actual: ${new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: selectedBankAccount?.currency ?? 'DOP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(expectedLedgerBalance)}`}
            description={
              visiblePreviewState.loading
                ? 'Calculando desde backend...'
                : `Previsualización backend usando cashMovements. ${visiblePreviewState.reconciledMovementCount ?? 0} movimiento(s) conciliados, ${visiblePreviewState.unreconciledMovementCount ?? 0} pendiente(s).`
            }
          />

        <Form.Item
          label="Balance estado de cuenta"
          name="statementBalance"
          rules={[{ required: true, message: 'Ingrese el balance del banco.' }]}
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
                : `Diferencia actual: ${new Intl.NumberFormat('es-DO', {
                    style: 'currency',
                    currency: selectedBankAccount?.currency ?? 'DOP',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(variance ?? 0)}`
            }
          />
        ) : null}

        <Form.Item
          label="Fecha estado de cuenta"
          name="statementDate"
          rules={[{ required: true, message: 'Seleccione la fecha del estado.' }]}
        >
          <DatePicker
            disabled={submitting}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
          />
        </Form.Item>

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
