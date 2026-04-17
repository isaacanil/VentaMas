import { useEffect, useMemo } from 'react';
import { Alert, Form, Input, InputNumber, Modal, Select } from 'antd';
import { DateTime } from 'luxon';

import DatePicker from '@/components/DatePicker';
import {
  CUSTOM_BANK_INSTITUTION_CODE,
  DEFAULT_BANK_INSTITUTION_COUNTRY_CODE,
  type BankInstitutionCatalogEntry,
} from '@/domain/banking/bankInstitutionCatalog';
import type { BankAccount, BankAccountType } from '@/types/accounting';
import {
  ACCOUNTING_CURRENCY_CODES,
  getCurrencyOptionLabel,
} from '@/utils/accounting/currencies';
import {
  getBankAccountDraftFormValues,
  type BankAccountDraft,
} from '@/utils/accounting/bankAccounts';
import { toMillis } from '@/utils/firebase/toTimestamp';
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
  bankInstitutionCatalog: readonly BankInstitutionCatalogEntry[];
  bankInstitutionCatalogError?: string | null;
  bankInstitutionCatalogLoading?: boolean;
  currencies: SupportedDocumentCurrency[];
  editingAccount?: BankAccount | null;
  open: boolean;
  onCancel: () => void;
  onSubmit: (draft: Partial<BankAccountDraft>, bankAccountId?: string) => Promise<void>;
  submitting?: boolean;
}

export const AddBankAccountModal = ({
  bankInstitutionCatalog,
  bankInstitutionCatalogError,
  bankInstitutionCatalogLoading = false,
  currencies,
  editingAccount,
  open,
  onCancel,
  onSubmit,
  submitting = false,
}: AddBankAccountModalProps) => {
  const [form] = Form.useForm<BankAccountDraft>();
  const selectedBankCode = Form.useWatch('bankCode', form);
  const isCustomBankSelected =
    selectedBankCode === CUSTOM_BANK_INSTITUTION_CODE;
  const institutionOptions = useMemo(
    () => [
      ...bankInstitutionCatalog.map((institution) => ({
        label: institution.name,
        value: institution.code,
      })),
      {
        label: 'Otro banco',
        value: CUSTOM_BANK_INSTITUTION_CODE,
      },
    ],
    [bankInstitutionCatalog],
  );
  const selectedBankFallbackOption =
    !selectedBankCode ||
    selectedBankCode === CUSTOM_BANK_INSTITUTION_CODE ||
    institutionOptions.some((option) => option.value === selectedBankCode)
      ? null
      : {
          label: editingAccount?.institutionName
            ? `${editingAccount.institutionName} (sin verificar)`
            : `${selectedBankCode} (sin verificar)`,
          value: selectedBankCode,
        };
  const resolvedInstitutionOptions = selectedBankFallbackOption
    ? [selectedBankFallbackOption, ...institutionOptions]
    : institutionOptions;
  const catalogUnavailable =
    !bankInstitutionCatalogLoading && !bankInstitutionCatalog.length;
  const isSubmitBlocked =
    submitting ||
    (!isCustomBankSelected &&
      (bankInstitutionCatalogLoading || !bankInstitutionCatalog.length));

  useEffect(() => {
    if (!open || !editingAccount) {
      return;
    }

    form.setFieldsValue({
      ...editingAccount,
      ...getBankAccountDraftFormValues(editingAccount, {
        bankInstitutionCatalog,
      }),
      openingBalanceDate: editingAccount.openingBalanceDate
        ? DateTime.fromMillis(toMillis(editingAccount.openingBalanceDate as any))
        : undefined,
    } as any);
  }, [bankInstitutionCatalog, editingAccount, form, open]);

  useEffect(() => {
    if (!open || editingAccount) {
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
      title={editingAccount ? 'Editar cuenta bancaria' : 'Agregar cuenta bancaria'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Guardar"
      cancelText="Cancelar"
      confirmLoading={submitting}
      okButtonProps={{ disabled: isSubmitBlocked }}
      cancelButtonProps={{ disabled: submitting }}
      destroyOnClose
      closable={!submitting}
      keyboard={!submitting}
      maskClosable={!submitting}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          currency: currencyOptions[0]?.value ?? 'DOP',
          type: 'checking',
          countryCode: DEFAULT_BANK_INSTITUTION_COUNTRY_CODE,
        }}
      >
        <Form.Item
          label="Nombre"
          name="name"
          rules={[{ required: true, message: 'Ingrese el nombre de la cuenta.' }]}
        >
          <Input placeholder="Ej. Cuenta operativa principal" maxLength={80} />
        </Form.Item>

        <Form.Item name="countryCode" hidden>
          <Input />
        </Form.Item>

        {bankInstitutionCatalogLoading ? (
          <Alert
            type="info"
            showIcon
            message="Cargando catalogo bancario"
            description="Validando bancos disponibles. Puedes esperar o registrar Otro banco."
            style={{ marginBottom: 16 }}
          />
        ) : null}

        {!bankInstitutionCatalogLoading && bankInstitutionCatalogError ? (
          <Alert
            type="warning"
            showIcon
            message="Catalogo bancario no disponible"
            description={`${bankInstitutionCatalogError} Mientras tanto, solo conviene usar Otro banco.`}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        {catalogUnavailable && !bankInstitutionCatalogError ? (
          <Alert
            type="warning"
            showIcon
            message="Catalogo bancario vacio"
            description="No hay bancos activos cargados para Republica Dominicana. Usa Otro banco o revisa el catalogo."
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Form.Item
          label="Banco"
          name="bankCode"
          rules={[
            {
              required: true,
              message: 'Seleccione el banco de la cuenta.',
            },
          ]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Seleccione banco"
            loading={bankInstitutionCatalogLoading}
            notFoundContent={
              bankInstitutionCatalogLoading
                ? 'Cargando bancos...'
                : 'No hay bancos disponibles.'
            }
            options={resolvedInstitutionOptions}
          />
        </Form.Item>

        {isCustomBankSelected ? (
          <Form.Item
            label="Banco personalizado"
            name="institutionCustomName"
            rules={[
              {
                required: true,
                message: 'Ingrese el nombre del banco.',
              },
              {
                max: 80,
                message: 'Use un nombre de banco mas corto.',
              },
            ]}
          >
            <Input placeholder="Ej. Banco multiple local" maxLength={80} />
          </Form.Item>
        ) : null}

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
