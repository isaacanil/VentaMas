import { useEffect, useMemo } from 'react';
import { Alert, Form, Input, InputNumber, Modal, Select } from 'antd';
import { DateTime } from 'luxon';

import DatePicker from '@/components/DatePicker';
import type { BankAccount } from '@/types/accounting';
import type { BankReconciliationDraft } from '@/modules/treasury/utils/records';

interface BankReconciliationModalProps {
  bankAccounts: BankAccount[];
  currentBalancesByAccountId: Record<string, number>;
  defaultBankAccountId?: string | null;
  open: boolean;
  onCancel: () => void;
  onSubmit: (draft: BankReconciliationDraft) => Promise<void>;
}

interface BankReconciliationFormValues {
  bankAccountId: string;
  notes?: string;
  reference?: string;
  statementBalance: number;
  statementDate?: DateTime;
}

export const BankReconciliationModal = ({
  bankAccounts,
  currentBalancesByAccountId,
  defaultBankAccountId,
  open,
  onCancel,
  onSubmit,
}: BankReconciliationModalProps) => {
  const [form] = Form.useForm<BankReconciliationFormValues>();

  useEffect(() => {
    if (!open) return;

    form.resetFields();
    if (defaultBankAccountId) {
      form.setFieldValue('bankAccountId', defaultBankAccountId);
    }
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
  const expectedLedgerBalance = selectedBankAccountId
    ? currentBalancesByAccountId[selectedBankAccountId] ?? 0
    : 0;

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
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Cuenta bancaria"
          name="bankAccountId"
          rules={[{ required: true, message: 'Seleccione la cuenta bancaria.' }]}
        >
          <Select options={bankOptions} showSearch optionFilterProp="label" />
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
        />

        <Form.Item
          label="Balance estado de cuenta"
          name="statementBalance"
          rules={[{ required: true, message: 'Ingrese el balance del banco.' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            step={0.01}
            precision={2}
            placeholder="0.00"
            addonBefore="$"
          />
        </Form.Item>

        <Form.Item label="Fecha estado de cuenta" name="statementDate">
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item label="Referencia" name="reference">
          <Input placeholder="Estado abril, corte semanal..." maxLength={80} />
        </Form.Item>

        <Form.Item label="Notas" name="notes">
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
