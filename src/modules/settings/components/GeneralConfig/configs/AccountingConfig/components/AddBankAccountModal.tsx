import { useEffect } from 'react';
import { Form, Input, InputNumber, Modal, Select } from 'antd';
import { DateTime } from 'luxon';

import DatePicker from '@/components/DatePicker';
import {
  ACCOUNTING_CURRENCY_CODES,
  getCurrencyOptionLabel,
} from '@/utils/accounting/currencies';
import type { BankAccount, BankAccountType } from '@/types/accounting';
import { toMillis } from '@/utils/firebase/toTimestamp';
import type { BankAccountDraft } from '@/utils/accounting/bankAccounts';
import type { SupportedDocumentCurrency } from '../utils/accountingConfig';

const BANK_ACCOUNT_TYPES: Array<{
  label: string;
  value: BankAccountType;
}> = [
  { label: 'Cuenta corriente', value: 'checking' },
  { label: 'Cuenta de ahorro', value: 'savings' },
  { label: 'Tarjeta de crédito', value: 'credit_card' },
  { label: 'Otra', value: 'other' },
];

interface AddBankAccountModalProps {
  currencies: SupportedDocumentCurrency[];
  editingAccount?: BankAccount | null;
  open: boolean;
  onCancel: () => void;
  onSubmit: (draft: Partial<BankAccountDraft>, bankAccountId?: string) => Promise<void>;
}

export const AddBankAccountModal = ({
  currencies,
  editingAccount,
  open,
  onCancel,
  onSubmit,
}: AddBankAccountModalProps) => {
  const [form] = Form.useForm<BankAccountDraft>();

  useEffect(() => {
    if (open) {
      if (editingAccount) {
        form.setFieldsValue({
          ...editingAccount,
          openingBalanceDate: editingAccount.openingBalanceDate
            ? DateTime.fromMillis(toMillis(editingAccount.openingBalanceDate as any))
            : undefined,
        } as any);
      } else {
        form.resetFields();
      }
    }
  }, [open, editingAccount, form]);
  const currencyOptions = (
    currencies.length ? currencies : ACCOUNTING_CURRENCY_CODES
  ).map((currency) => ({
    label: getCurrencyOptionLabel(currency),
    value: currency,
  }));

  const handleCancel = () => {
    onCancel();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit(values, editingAccount?.id);
  };

  return (
    <Modal
      title={editingAccount ? 'Editar cuenta bancaria' : 'Agregar cuenta bancaria'}
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText="Guardar"
      cancelText="Cancelar"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          currency: currencyOptions[0]?.value ?? 'DOP',
          type: 'checking',
        }}
      >
        <Form.Item
          label="Nombre"
          name="name"
          rules={[{ required: true, message: 'Ingrese el nombre de la cuenta.' }]}
        >
          <Input placeholder="Ej. Cuenta operativa principal" maxLength={80} />
        </Form.Item>

        <Form.Item label="Banco" name="institutionName">
          <Input placeholder="Ej. Banco Popular" maxLength={80} />
        </Form.Item>

        <Form.Item label="Tipo" name="type">
          <Select options={BANK_ACCOUNT_TYPES} />
        </Form.Item>

        <Form.Item
          label="Moneda"
          name="currency"
          rules={[{ required: true, message: 'Seleccione la moneda.' }]}
        >
          <Select options={currencyOptions} />
        </Form.Item>

        <Form.Item label="Últimos 4 dígitos" name="accountNumberLast4">
          <Input placeholder="1234" maxLength={4} />
        </Form.Item>

        <Form.Item label="Balance inicial" name="openingBalance">
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            step={0.01}
            precision={2}
            placeholder="0.00"
            addonBefore="$"
          />
        </Form.Item>

        <Form.Item label="Fecha balance inicial" name="openingBalanceDate">
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item label="Notas" name="notes">
          <Input.TextArea
            placeholder="Detalle opcional para identificar la cuenta"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={240}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
