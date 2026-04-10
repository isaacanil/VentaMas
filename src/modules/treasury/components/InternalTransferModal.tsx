import { useEffect, useMemo } from 'react';
import { Form, Input, InputNumber, Modal, Select } from 'antd';
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
}: InternalTransferModalProps) => {
  const [form] = Form.useForm<InternalTransferFormValues>();

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    if (defaultSourceAccountKey) {
      form.setFieldValue('fromAccountKey', defaultSourceAccountKey);
    }
  }, [defaultSourceAccountKey, form, open]);

  const accountOptions = useMemo(
    () =>
      accounts
        .filter((account) => account.status === 'active')
        .map((account) => ({
          label: getAccountOptionLabel(account),
          value: account.key,
        })),
    [accounts],
  );

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
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Desde"
          name="fromAccountKey"
          rules={[{ required: true, message: 'Seleccione la cuenta origen.' }]}
        >
          <Select options={accountOptions} showSearch optionFilterProp="label" />
        </Form.Item>

        <Form.Item
          label="Hacia"
          name="toAccountKey"
          rules={[{ required: true, message: 'Seleccione la cuenta destino.' }]}
        >
          <Select options={accountOptions} showSearch optionFilterProp="label" />
        </Form.Item>

        <Form.Item
          label="Monto"
          name="amount"
          rules={[{ required: true, message: 'Ingrese el monto.' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            step={0.01}
            precision={2}
            placeholder="0.00"
            addonBefore="$"
          />
        </Form.Item>

        <Form.Item label="Fecha" name="occurredAt">
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item label="Referencia" name="reference">
          <Input placeholder="Depósito, retiro, traslado..." maxLength={80} />
        </Form.Item>

        <Form.Item label="Notas" name="notes">
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
