import { useEffect } from 'react';
import { Form, Input, InputNumber, Modal, Select } from 'antd';
import { DateTime } from 'luxon';

import DatePicker from '@/components/DatePicker';
import {
  ACCOUNTING_CURRENCY_CODES,
  getCurrencyOptionLabel,
} from '@/utils/accounting/currencies';
import type { CashAccount, CashAccountType } from '@/types/accounting';
import { toMillis } from '@/utils/firebase/toTimestamp';
import type { CashAccountDraft } from '@/utils/accounting/cashAccounts';
import type { SupportedDocumentCurrency } from '@/utils/accounting/currencies';

const CASH_ACCOUNT_TYPES: Array<{ label: string; value: CashAccountType }> = [
  { label: 'Caja operativa', value: 'register' },
  { label: 'Caja chica', value: 'petty_cash' },
  { label: 'Bóveda', value: 'vault' },
  { label: 'Otra', value: 'other' },
];

interface AddCashAccountModalProps {
  currencies: SupportedDocumentCurrency[];
  editingAccount?: CashAccount | null;
  open: boolean;
  onCancel: () => void;
  onSubmit: (draft: Partial<CashAccountDraft>, cashAccountId?: string) => Promise<void>;
}

export const AddCashAccountModal = ({
  currencies,
  editingAccount,
  open,
  onCancel,
  onSubmit,
}: AddCashAccountModalProps) => {
  const [form] = Form.useForm<CashAccountDraft>();

  useEffect(() => {
    if (!open) return;

    if (editingAccount) {
      form.setFieldsValue({
        ...editingAccount,
        openingBalanceDate: editingAccount.openingBalanceDate
          ? DateTime.fromMillis(toMillis(editingAccount.openingBalanceDate as never))
          : undefined,
      } as never);
      return;
    }

    form.resetFields();
  }, [editingAccount, form, open]);

  const currencyOptions = (
    currencies.length ? currencies : ACCOUNTING_CURRENCY_CODES
  ).map((currency) => ({
    label: getCurrencyOptionLabel(currency),
    value: currency,
  }));

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit(values, editingAccount?.id);
  };

  return (
    <Modal
      destroyOnClose
      title={editingAccount ? 'Editar cuenta de caja' : 'Agregar cuenta de caja'}
      open={open}
      okText="Guardar"
      cancelText="Cancelar"
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          currency: currencyOptions[0]?.value ?? 'DOP',
          type: 'register',
        }}
      >
        <Form.Item
          label="Nombre"
          name="name"
          rules={[{ required: true, message: 'Ingrese el nombre de la caja.' }]}
        >
          <Input placeholder="Ej. Caja principal" maxLength={80} />
        </Form.Item>

        <Form.Item label="Ubicación" name="location">
          <Input placeholder="Ej. Sucursal principal" maxLength={80} />
        </Form.Item>

        <Form.Item label="Tipo" name="type">
          <Select options={CASH_ACCOUNT_TYPES} />
        </Form.Item>

        <Form.Item
          label="Moneda"
          name="currency"
          rules={[{ required: true, message: 'Seleccione la moneda.' }]}
        >
          <Select options={currencyOptions} />
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
            placeholder="Detalle operativo opcional"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={240}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
