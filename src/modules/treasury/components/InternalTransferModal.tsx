import { useEffect, useMemo } from 'react';
import { Alert, Checkbox, Form, Input, InputNumber, Modal, Select } from 'antd';
import { DateTime } from 'luxon';

import DatePicker from '@/components/DatePicker';
import type { TreasuryLiquidityAccount } from '@/modules/treasury/utils/liquidity';
import { parseLiquidityAccountKey } from '@/modules/treasury/utils/liquidity';
import type { InternalTransferDraft } from '@/modules/treasury/utils/records';

interface InternalTransferModalProps {
  accounts: TreasuryLiquidityAccount[];
  currentBalancesByAccountKey: Record<string, number>;
  defaultSourceAccountKey?: string | null;
  open: boolean;
  onCancel: () => void;
  onSubmit: (draft: InternalTransferDraft) => Promise<void>;
  submitting?: boolean;
}

interface InternalTransferFormValues {
  allowOverdraft?: boolean;
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
  currentBalancesByAccountKey,
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
  const amountInput = Form.useWatch('amount', form);
  const allowOverdraftInput = Form.useWatch('allowOverdraft', form);
  const transferAmount = Number(amountInput);
  const hasTransferAmount = Number.isFinite(transferAmount) && transferAmount > 0;
  const sourceCurrentBalance = selectedSourceAccount
    ? Number(
        currentBalancesByAccountKey[selectedSourceAccount.key] ??
          selectedSourceAccount.openingBalance ??
          0,
      )
    : null;
  const sourceProjectedBalance =
    sourceCurrentBalance != null && hasTransferAmount
      ? Number((sourceCurrentBalance - transferAmount).toFixed(2))
      : null;
  const hasOverdraftRisk =
    sourceProjectedBalance != null && sourceProjectedBalance < 0;
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
    (!selectedSourceAccount || availableDestinationCount > 0) &&
    (!hasOverdraftRisk || allowOverdraftInput === true);

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
      allowOverdraft: values.allowOverdraft === true,
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
        {selectedSourceAccount && sourceCurrentBalance != null ? (
          <Alert
            style={{ marginBottom: 16 }}
            type={hasOverdraftRisk ? 'warning' : 'info'}
            showIcon
            message={`Saldo origen actual: ${new Intl.NumberFormat('es-DO', {
              style: 'currency',
              currency: selectedSourceAccount.currency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(sourceCurrentBalance)}`}
            description={
              hasOverdraftRisk
                ? `Saldo proyectado: ${new Intl.NumberFormat('es-DO', {
                    style: 'currency',
                    currency: selectedSourceAccount.currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(sourceProjectedBalance ?? 0)}. Debes autorizar sobregiro para continuar.`
                : sourceProjectedBalance != null
                  ? `Saldo proyectado después de transferir: ${new Intl.NumberFormat('es-DO', {
                      style: 'currency',
                      currency: selectedSourceAccount.currency,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(sourceProjectedBalance)}`
                  : 'Selecciona monto para ver saldo proyectado.'
            }
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

        {hasOverdraftRisk ? (
          <Form.Item
            name="allowOverdraft"
            valuePropName="checked"
            rules={[
              {
                validator: async (_, value) => {
                  if (value === true) return;
                  throw new Error(
                    'Debes autorizar sobregiro explícitamente para registrar esta transferencia.',
                  );
                },
              },
            ]}
          >
            <Checkbox disabled={submitting}>
              Autorizar sobregiro para esta transferencia
            </Checkbox>
          </Form.Item>
        ) : null}

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
