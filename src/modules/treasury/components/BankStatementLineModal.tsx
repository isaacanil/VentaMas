import { useEffect, useMemo } from 'react';
import { Alert, Form, Input, InputNumber, Modal, Select } from 'antd';
import { DateTime } from 'luxon';

import DatePicker from '@/components/DatePicker';
import type { BankAccount, LiquidityLedgerEntry } from '@/types/accounting';
import type { BankStatementLineDraft } from '@/modules/treasury/utils/records';

interface BankStatementLineFormValues {
  amount: number;
  description?: string;
  direction: 'in' | 'out';
  movementIds?: string[];
  reference?: string;
  statementDate?: DateTime;
}

interface BankStatementLineModalProps {
  bankAccount: BankAccount | null;
  ledgerEntries: LiquidityLedgerEntry[];
  open: boolean;
  onCancel: () => void;
  onSubmit: (draft: BankStatementLineDraft) => Promise<void>;
  submitting?: boolean;
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const BankStatementLineModal = ({
  bankAccount,
  ledgerEntries,
  open,
  onCancel,
  onSubmit,
  submitting = false,
}: BankStatementLineModalProps) => {
  const [form] = Form.useForm<BankStatementLineFormValues>();

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    form.setFieldsValue({
      direction: 'in',
      statementDate: DateTime.now(),
    });
  }, [form, open]);

  const selectedMovementIdsInput = Form.useWatch('movementIds', form);
  const selectedMovementIds = useMemo(
    () => selectedMovementIdsInput ?? [],
    [selectedMovementIdsInput],
  );
  const direction = Form.useWatch('direction', form);
  const amountInput = Form.useWatch('amount', form);
  const amount = Number(amountInput);
  const signedAmount =
    direction === 'out' ? Number((-amount || 0).toFixed(2)) : Number((amount || 0).toFixed(2));
  const availableEntries = useMemo(
    () =>
      ledgerEntries.filter(
        (entry) =>
          entry.accountType === 'bank' &&
          entry.status !== 'void' &&
          entry.reconciliationStatus !== 'reconciled',
      ),
    [ledgerEntries],
  );
  const selectedMovements = useMemo(
    () =>
      availableEntries.filter((entry) => selectedMovementIds.includes(entry.id)),
    [availableEntries, selectedMovementIds],
  );
  const selectedMovementTotal = Number(
    selectedMovements
      .reduce(
        (sum, entry) =>
          sum + (entry.direction === 'out' ? -Number(entry.amount) : Number(entry.amount)),
        0,
      )
      .toFixed(2),
  );
  const exactMatch =
    selectedMovements.length > 0 &&
    Number.isFinite(signedAmount) &&
    signedAmount !== 0 &&
    selectedMovementTotal === signedAmount;
  const willCreatePendingException = !exactMatch;

  const movementOptions = useMemo(
    () =>
      availableEntries.map((entry) => ({
        label: `${entry.reference || entry.description || entry.sourceType} · ${formatMoney(
          entry.direction === 'out' ? -Number(entry.amount) : Number(entry.amount),
          entry.currency,
        )}`,
        value: entry.id,
      })),
    [availableEntries],
  );

  const handleSubmit = async () => {
    if (!bankAccount) return;

    const values = await form.validateFields();
    await onSubmit({
      amount: values.amount,
      bankAccountId: bankAccount.id,
      description: values.description?.trim() || null,
      direction: values.direction,
      movementIds: values.movementIds ?? [],
      reference: values.reference?.trim() || null,
      statementDate:
        values.statementDate?.toJSDate?.() ?? values.statementDate ?? null,
    });
  };

  return (
    <Modal
      destroyOnClose
      title="Registrar línea de extracto"
      open={open}
      okText="Guardar"
      cancelText="Cancelar"
      closable={!submitting}
      confirmLoading={submitting}
      keyboard={!submitting}
      maskClosable={false}
      cancelButtonProps={{ disabled: submitting }}
      onCancel={() => {
        if (submitting) return;
        onCancel();
      }}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        <Alert
          style={{ marginBottom: 16 }}
          type={willCreatePendingException ? 'warning' : 'success'}
          showIcon
          message={
            willCreatePendingException
              ? 'Se registrará como excepción pendiente'
              : 'Match exacto listo para conciliar'
          }
          description={
            willCreatePendingException
              ? selectedMovements.length === 0
                ? 'Sin movimientos seleccionados. La línea quedará pendiente para revisión manual.'
                : `Monto línea ${formatMoney(signedAmount || 0, bankAccount?.currency ?? 'DOP')} vs movimientos ${formatMoney(
                    selectedMovementTotal,
                    bankAccount?.currency ?? 'DOP',
                  )}.`
              : `Se conciliarán ${selectedMovements.length} movimiento(s) por ${formatMoney(
                  selectedMovementTotal,
                  bankAccount?.currency ?? 'DOP',
                )}.`
          }
        />

        <Form.Item
          label="Fecha extracto"
          name="statementDate"
          rules={[{ required: true, message: 'Seleccione la fecha.' }]}
        >
          <DatePicker
            disabled={submitting}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
          />
        </Form.Item>

        <Form.Item
          label="Dirección"
          name="direction"
          rules={[{ required: true, message: 'Seleccione la dirección.' }]}
        >
          <Select
            disabled={submitting}
            options={[
              { label: 'Entrada', value: 'in' },
              { label: 'Salida', value: 'out' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Monto extracto"
          name="amount"
          rules={[{ required: true, message: 'Ingrese el monto.' }]}
        >
          <InputNumber
            disabled={submitting}
            style={{ width: '100%' }}
            min={0.01}
            step={0.01}
            precision={2}
            placeholder="0.00"
            addonBefore="$"
          />
        </Form.Item>

        <Form.Item label="Movimientos a vincular" name="movementIds">
          <Select
            disabled={submitting}
            mode="multiple"
            options={movementOptions}
            placeholder="Selecciona movimientos del ledger"
            optionFilterProp="label"
            showSearch
          />
        </Form.Item>

        <Form.Item label="Referencia" name="reference">
          <Input
            disabled={submitting}
            placeholder="Depósito, débito, referencia bancaria..."
            maxLength={80}
          />
        </Form.Item>

        <Form.Item label="Descripción" name="description">
          <Input.TextArea
            disabled={submitting}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
