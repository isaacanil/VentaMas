import { useEffect, useMemo } from 'react';
import { Form, Input, Modal, Select, Switch } from 'antd';

import type { ChartOfAccount } from '@/types/accounting';
import {
  CHART_OF_ACCOUNT_CURRENCY_MODE_LABELS,
  CHART_OF_ACCOUNT_NORMAL_SIDE_LABELS,
  CHART_OF_ACCOUNT_TYPE_LABELS,
  collectChartOfAccountDescendantIds,
  deriveNormalSideForChartOfAccountType,
  type ChartOfAccountDraft,
} from '@/utils/accounting/chartOfAccounts';

interface AddChartOfAccountModalProps {
  accounts: ChartOfAccount[];
  createDefaults?: Partial<ChartOfAccountDraft> | null;
  editingAccount: ChartOfAccount | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (
    draft: Partial<ChartOfAccountDraft>,
    chartOfAccountId?: string,
  ) => Promise<boolean>;
  open: boolean;
}

const CHART_OF_ACCOUNT_TYPE_OPTIONS = Object.entries(
  CHART_OF_ACCOUNT_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value,
}));

const CHART_OF_ACCOUNT_NORMAL_SIDE_OPTIONS = Object.entries(
  CHART_OF_ACCOUNT_NORMAL_SIDE_LABELS,
).map(([value, label]) => ({
  label,
  value,
}));

const CHART_OF_ACCOUNT_CURRENCY_MODE_OPTIONS = Object.entries(
  CHART_OF_ACCOUNT_CURRENCY_MODE_LABELS,
).map(([value, label]) => ({
  label,
  value,
}));

export const AddChartOfAccountModal = ({
  accounts,
  createDefaults,
  editingAccount,
  loading,
  onCancel,
  onSubmit,
  open,
}: AddChartOfAccountModalProps) => {
  const [form] = Form.useForm<Partial<ChartOfAccountDraft>>();
  const descendantIds = useMemo(
    () =>
      editingAccount
        ? collectChartOfAccountDescendantIds(accounts, editingAccount.id)
        : new Set<string>(),
    [accounts, editingAccount],
  );
  const parentOptions = useMemo(
    () =>
      accounts
        .filter((account) => {
          if (editingAccount && account.id === editingAccount.id) {
            return false;
          }

          if (editingAccount && descendantIds.has(account.id)) {
            return false;
          }

          return (
            account.status === 'active' || account.id === editingAccount?.parentId
          );
        })
        .map((account) => ({
          label: `${account.code} · ${account.name}`,
          value: account.id,
        })),
    [accounts, descendantIds, editingAccount],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!editingAccount) {
      form.resetFields();
      form.setFieldsValue({
        type: createDefaults?.type ?? 'asset',
        normalSide: createDefaults?.normalSide ?? 'debit',
        parentId: createDefaults?.parentId ?? undefined,
        postingAllowed: createDefaults?.postingAllowed ?? true,
        currencyMode: createDefaults?.currencyMode ?? 'functional_only',
      });
      return;
    }

    form.setFieldsValue({
      code: editingAccount.code,
      name: editingAccount.name,
      type: editingAccount.type,
      normalSide: editingAccount.normalSide,
      parentId: editingAccount.parentId ?? undefined,
      currencyMode: editingAccount.currencyMode,
      subtype: editingAccount.subtype ?? undefined,
      postingAllowed: editingAccount.postingAllowed,
    });
  }, [createDefaults, editingAccount, form, open]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const saved = await onSubmit(values, editingAccount?.id);
    if (saved) {
      form.resetFields();
    }
  };

  return (
    <Modal
      destroyOnClose
      open={open}
      title={
        editingAccount
          ? 'Editar cuenta contable'
          : createDefaults?.parentId
            ? 'Agregar subcuenta'
            : 'Agregar cuenta contable'
      }
      okText={
        editingAccount
          ? 'Guardar cambios'
          : createDefaults?.parentId
            ? 'Guardar subcuenta'
            : 'Guardar cuenta'
      }
      cancelText="Cancelar"
      confirmLoading={loading}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={() => void handleSubmit()}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'asset',
          normalSide: 'debit',
          parentId: undefined,
          postingAllowed: true,
          currencyMode: 'functional_only',
        }}
        onValuesChange={(changedValues) => {
          if (!('type' in changedValues) || !changedValues.type) {
            return;
          }

          form.setFieldValue(
            'normalSide',
            deriveNormalSideForChartOfAccountType(changedValues.type),
          );
        }}
      >
        <Form.Item
          label="Código"
          name="code"
          rules={[
            { required: true, message: 'Ingrese el código contable.' },
            {
              validator: async (_, value: string | undefined) => {
                if (!value?.trim()) {
                  return Promise.resolve();
                }

                if (value.trim().length < 3) {
                  return Promise.reject(
                    new Error('Usa al menos 3 caracteres en el código.'),
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="Ej. 1100" />
        </Form.Item>

        <Form.Item
          label="Nombre"
          name="name"
          rules={[{ required: true, message: 'Ingrese el nombre de la cuenta.' }]}
        >
          <Input placeholder="Ej. Caja general" />
        </Form.Item>

        <Form.Item label="Tipo" name="type">
          <Select options={CHART_OF_ACCOUNT_TYPE_OPTIONS} />
        </Form.Item>

        <Form.Item label="Lado normal" name="normalSide">
          <Select options={CHART_OF_ACCOUNT_NORMAL_SIDE_OPTIONS} />
        </Form.Item>

        <Form.Item label="Cuenta padre" name="parentId">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Sin cuenta padre"
            options={parentOptions}
          />
        </Form.Item>

        <Form.Item label="Modo de moneda" name="currencyMode">
          <Select options={CHART_OF_ACCOUNT_CURRENCY_MODE_OPTIONS} />
        </Form.Item>

        <Form.Item label="Subtipo" name="subtype">
          <Input placeholder="Opcional: caja, banco, impuesto, etc." />
        </Form.Item>

        <Form.Item
          label="Permite asientos directos"
          name="postingAllowed"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};
