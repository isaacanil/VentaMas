import { useEffect, useMemo } from 'react';
import { Alert, Form, Input, InputNumber, Modal, Select } from 'antd';
import { DateTime } from 'luxon';

import DatePicker from '@/components/DatePicker';
import type { TreasuryLiquidityAccount } from '@/modules/treasury/utils/liquidity';
import { parseLiquidityAccountKey } from '@/modules/treasury/utils/liquidity';
import type { InternalTransferDraft } from '@/modules/treasury/utils/records';

interface InternalTransferModalProps {
  accounts: TreasuryLiquidityAccount[];
  defaultSourceAccountKey?: string | null;
  open: boolean;
  onCancel: () => void;
  onSubmit: (draft: InternalTransferDraft) => Promise<void>;
  submitting?: boolean;
}

interface InternalTransferFormValues {
  amount: number;
  fromAccountKey: string;
  notes?: string;
  occurredAt?: DateTime;
  reference?: string;
  toAccountKey: string;
}

const getAccountOptionLabel = (account: TreasuryLiquidityAccount) =>
  `${account.label} · ${account.kind === 'bank' ? 'Banco' : 'Caja'}`;

export const InternalTransferModal = ({
  accounts,
  defaultSourceAccountKey,
  open,
  onCancel,
  onSubmit,
  submitting = false,
}: InternalTransferModalProps) => {
  const [form] = Form.useForm<InternalTransferFormValues>();

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    form.setFieldsValue({
      fromAccountKey: defaultSourceAccountKey ?? undefined,
      occurredAt: DateTime.now(),
    });
  }, [defaultSourceAccountKey, form, open]);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.status === 'active'),
    [accounts],
  );
  const selectedSourceAccountKey = Form.useWatch('fromAccountKey', form);
  const selectedSourceAccount =
    activeAccounts.find((account) => account.key === selectedSourceAccountKey) ??
    null;
  const sourceAccountOptions = useMemo(
    () =>
      activeAccounts.map((account) => ({
        label: getAccountOptionLabel(account),
        value: account.key,
      })),
    [activeAccounts],
  );
  const destinationAccountOptions = useMemo(
    () =>
      activeAccounts.map((account) => {
        const sameAccount = account.key === selectedSourceAccountKey;
        const currencyMismatch =
          selectedSourceAccount != null &&
          account.currency !== selectedSourceAccount.currency;

        let disabled = sameAccount;
        let title: string | undefined;
        if (sameAccount) {
          title = 'La cuenta destino debe ser distinta al origen.';
        } else if (currencyMismatch) {
          disabled = true;
          title = 'La transferencia interna requiere misma moneda.';
        }

        return {
          disabled,
          label: getAccountOptionLabel(account),
          title,
          value: account.key,
        };
      }),
    [activeAccounts, selectedSourceAccount, selectedSourceAccountKey],
  );
  const availableDestinationCount = useMemo(
    () =>
      destinationAccountOptions.filter((option) => option.disabled !== true)
        .length,
    [destinationAccountOptions],
  );
  const canSubmit =
    activeAccounts.length >= 2 &&
    (!selectedSourceAccount || availableDestinationCount > 0);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const fromAccount = parseLiquidityAccountKey(values.fromAccountKey);
    const toAccount = parseLiquidityAccountKey(values.toAccountKey);
    const sourceAccount = accounts.find(
      (account) => account.key === values.fromAccountKey,
    );

    if (!fromAccount || !toAccount || !sourceAccount) {
      return;
    }

    await onSubmit({
      amount: values.amount,
      currency: sourceAccount.currency,
      fromAccountId: fromAccount.accountId,
      fromAccountType: fromAccount.kind,
      occurredAt: values.occurredAt?.toJSDate?.() ?? values.occurredAt ?? null,
      notes: values.notes?.trim() || null,
      reference: values.reference?.trim() || null,
      toAccountId: toAccount.accountId,
      toAccountType: toAccount.kind,
    });
  };

  return (
    <Modal
      destroyOnClose
      title="Transferencia interna"
      open={open}
      okText="Registrar"
      cancelText="Cancelar"
      closable={!submitting}
      confirmLoading={submitting}
      keyboard={!submitting}
      maskClosable={false}
      okButtonProps={{ disabled: !canSubmit || submitting }}
      cancelButtonProps={{ disabled: submitting }}
      onCancel={() => {
        if (submitting) return;
        onCancel();
      }}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        {activeAccounts.length < 2 ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="warning"
            showIcon
            message="Necesitas al menos dos cuentas activas para registrar una transferencia interna."
          />
        ) : null}
        {selectedSourceAccount && availableDestinationCount === 0 ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="warning"
            showIcon
            message="No hay cuentas destino elegibles."
            description="Elige otra cuenta origen o activa una cuenta de la misma moneda."
          />
        ) : null}

        <Form.Item
          label="Desde"
          name="fromAccountKey"
          rules={[{ required: true, message: 'Seleccione la cuenta origen.' }]}
        >
          <Select
            disabled={submitting}
            options={sourceAccountOptions}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="Hacia"
          name="toAccountKey"
          dependencies={['fromAccountKey']}
          rules={[
            { required: true, message: 'Seleccione la cuenta destino.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const fromAccountKey = getFieldValue('fromAccountKey');
                if (!value || !fromAccountKey || value !== fromAccountKey) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error('La cuenta destino debe ser distinta al origen.'),
                );
              },
            }),
          ]}
        >
          <Select
            disabled={submitting}
            options={destinationAccountOptions}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          label="Monto"
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

        <Form.Item
          label="Fecha"
          name="occurredAt"
          rules={[{ required: true, message: 'Seleccione la fecha.' }]}
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
            placeholder="Depósito, retiro, traslado..."
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
