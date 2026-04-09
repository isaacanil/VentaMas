import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useMemo } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import styled from 'styled-components';
import { InfoCircleOutlined } from '@ant-design/icons';

import type {
  AccountingEventType,
  AccountingPostingProfile,
  ChartOfAccount,
} from '@/types/accounting';
import {
  ACCOUNTING_EVENT_DEFINITIONS,
  ACCOUNTING_MODULE_LABELS,
  getAccountingEventDefinition,
} from '@/utils/accounting/accountingEvents';
import {
  ACCOUNTING_POSTING_AMOUNT_SOURCE_LABELS,
  ACCOUNTING_POSTING_PAYMENT_TERM_LABELS,
  ACCOUNTING_POSTING_SETTLEMENT_KIND_LABELS,
  ACCOUNTING_POSTING_TAX_TREATMENT_LABELS,
  normalizeAccountingPostingProfileDraft,
  type AccountingPostingProfileDraft,
} from '@/utils/accounting/postingProfiles';

const { Text } = Typography;

interface AddPostingProfileModalProps {
  chartOfAccounts: ChartOfAccount[];
  editingProfile: AccountingPostingProfile | null;
  loading: boolean;
  lockedEventType?: AccountingEventType;
  onCancel: () => void;
  onSubmit: (
    draft: Partial<AccountingPostingProfileDraft>,
    postingProfileId?: string,
  ) => Promise<boolean>;
  open: boolean;
}

const EVENT_OPTIONS = ACCOUNTING_EVENT_DEFINITIONS.map((definition) => ({
  label: definition.label,
  value: definition.eventType,
}));

const MODULE_OPTIONS = Object.entries(ACCOUNTING_MODULE_LABELS).map(
  ([value, label]) => ({
    label,
    value,
  }),
);

const AMOUNT_SOURCE_OPTIONS = Object.entries(
  ACCOUNTING_POSTING_AMOUNT_SOURCE_LABELS,
).map(([value, label]) => ({
  label,
  value,
}));

const PAYMENT_TERM_OPTIONS = Object.entries(
  ACCOUNTING_POSTING_PAYMENT_TERM_LABELS,
).map(([value, label]) => ({
  label,
  value,
}));

const SETTLEMENT_KIND_OPTIONS = Object.entries(
  ACCOUNTING_POSTING_SETTLEMENT_KIND_LABELS,
).map(([value, label]) => ({
  label,
  value,
}));

const TAX_TREATMENT_OPTIONS = Object.entries(
  ACCOUNTING_POSTING_TAX_TREATMENT_LABELS,
).map(([value, label]) => ({
  label,
  value,
}));

const DEFAULT_FORM_VALUES = normalizeAccountingPostingProfileDraft({});

export const AddPostingProfileModal = ({
  chartOfAccounts,
  editingProfile,
  loading,
  lockedEventType,
  onCancel,
  onSubmit,
  open,
}: AddPostingProfileModalProps) => {
  const [form] = Form.useForm<Partial<AccountingPostingProfileDraft>>();
  const referencedAccountIds = useMemo(
    () =>
      new Set(
        editingProfile?.linesTemplate
          .map((line) => line.accountId)
          .filter((accountId): accountId is string => Boolean(accountId)) ?? [],
      ),
    [editingProfile],
  );
  const defaultFormValues = useMemo(() => {
    if (!lockedEventType) {
      return DEFAULT_FORM_VALUES;
    }

    const eventDefinition = getAccountingEventDefinition(lockedEventType);

    return normalizeAccountingPostingProfileDraft({
      eventType: eventDefinition.eventType,
      moduleKey: eventDefinition.moduleKey,
      status: 'active',
    });
  }, [lockedEventType]);
  const isEventLocked = Boolean(lockedEventType || editingProfile);
  const accountOptions = useMemo(
    () =>
      chartOfAccounts
        .filter(
          (account) =>
            (account.status === 'active' && account.postingAllowed) ||
            referencedAccountIds.has(account.id),
        )
        .map((account) => ({
          disabled: account.status !== 'active' || !account.postingAllowed,
          label: [
            `${account.code} · ${account.name}`,
            account.status !== 'active' ? 'Inactiva' : null,
            !account.postingAllowed ? 'No admite asientos' : null,
          ]
            .filter(Boolean)
            .join(' · '),
          value: account.id,
        })),
    [chartOfAccounts, referencedAccountIds],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!editingProfile) {
      form.resetFields();
      form.setFieldsValue(defaultFormValues);
      return;
    }

    const eventType = lockedEventType ?? editingProfile.eventType;
    const eventDefinition = getAccountingEventDefinition(eventType);

    form.setFieldsValue({
      name: editingProfile.name,
      description: editingProfile.description ?? undefined,
      eventType,
      moduleKey: eventDefinition.moduleKey,
      priority: editingProfile.priority,
      status: editingProfile.status,
      conditions: editingProfile.conditions ?? undefined,
      linesTemplate: editingProfile.linesTemplate.map((line) => ({
        id: line.id,
        side: line.side,
        accountId: line.accountId ?? undefined,
        amountSource: line.amountSource,
        description: line.description ?? undefined,
        omitIfZero: line.omitIfZero,
      })),
    });
  }, [defaultFormValues, editingProfile, form, lockedEventType, open]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const saved = await onSubmit(values, editingProfile?.id);
    if (saved) {
      form.resetFields();
    }
  };

  const watchedEventType = Form.useWatch('eventType', form);
  const watchedModuleKey = Form.useWatch('moduleKey', form);

  // Intentar obtener los valores de múltiples fuentes para mayor robustez
  const effectiveEventType =
    watchedEventType ??
    form.getFieldValue('eventType') ??
    lockedEventType ??
    editingProfile?.eventType;

  const eventLabel = useMemo(() => {
    if (!effectiveEventType) return null;
    return getAccountingEventDefinition(effectiveEventType).label;
  }, [effectiveEventType]);

  const moduleLabel = useMemo(() => {
    const moduleKey =
      watchedModuleKey ??
      form.getFieldValue('moduleKey') ??
      (effectiveEventType
        ? getAccountingEventDefinition(effectiveEventType).moduleKey
        : null);

    if (!moduleKey) return null;

    return (
      ACCOUNTING_MODULE_LABELS[moduleKey as keyof typeof ACCOUNTING_MODULE_LABELS] ??
      moduleKey
    );
  }, [watchedModuleKey, form, effectiveEventType]);

  return (
    <Modal
      destroyOnClose
      width={920}
      open={open}
      title={
        editingProfile ? 'Editar perfil contable' : 'Agregar perfil contable'
      }
      okText={editingProfile ? 'Guardar cambios' : 'Guardar perfil'}
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
        initialValues={defaultFormValues}
        onValuesChange={(changedValues) => {
          if (lockedEventType || !changedValues.eventType) {
            return;
          }

          form.setFieldValue(
            'moduleKey',
            getAccountingEventDefinition(changedValues.eventType).moduleKey,
          );
        }}
      >
        <Space
          direction="vertical"
          size={8}
          style={{ display: 'flex', marginBottom: 16 }}
        >
          <Text type="secondary">
            Define aquí la regla contable por evento. El asiento final todavía
            no se genera, pero esta configuración ya deja armado el mapeo.
          </Text>
        </Space>

        {isEventLocked && (
          <>
            <Form.Item name="eventType" noStyle hidden>
              <Input />
            </Form.Item>
            <Form.Item name="moduleKey" noStyle hidden>
              <Input />
            </Form.Item>

            <HeaderMetaWrapper>
              <Space split={<Divider type="vertical" />}>
                <MetaItem>
                  <Text type="secondary">Evento:</Text>
                  <Tag color="processing" style={{ marginRight: 0 }}>
                    {eventLabel || '---'}
                  </Tag>
                </MetaItem>
                <MetaItem>
                  <Text type="secondary">Módulo:</Text>
                  <Tag style={{ marginRight: 0 }}>{moduleLabel || '---'}</Tag>
                </MetaItem>
              </Space>
            </HeaderMetaWrapper>
          </>
        )}

        <TwoColumnGrid>
          <Form.Item
            label="Nombre"
            name="name"
            rules={[{ required: true, message: 'Ingrese el nombre del perfil.' }]}
          >
            <Input placeholder="Ej. Venta al contado" />
          </Form.Item>

          <Form.Item
            label="Prioridad"
            name="priority"
            tooltip="Los perfiles con mayor prioridad (número menor) se evalúan primero."
            rules={[
              {
                required: true,
                message: 'Ingrese la prioridad del perfil.',
              },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          {!isEventLocked && (
            <>
              <Form.Item
                label="Evento contable"
                name="eventType"
                rules={[{ required: true, message: 'Seleccione el evento.' }]}
              >
                <Select options={EVENT_OPTIONS} />
              </Form.Item>

              <Form.Item
                label="Módulo"
                name="moduleKey"
                rules={[{ required: true, message: 'Seleccione el módulo.' }]}
              >
                <Select disabled options={MODULE_OPTIONS} />
              </Form.Item>
            </>
          )}
        </TwoColumnGrid>

        <Form.Item label="Descripción" name="description">
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder="Describe cuándo aplica este perfil."
          />
        </Form.Item>

        <SectionTitle>
          <Text strong>Condiciones de aplicación</Text>
          <Tooltip title="Filtros opcionales que determinan cuándo se dispara este asiento.">
            <InfoCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
          </Tooltip>
        </SectionTitle>

        <ThreeColumnGrid>
          <Form.Item label="Término de pago" name={['conditions', 'paymentTerm']}>
            <Select allowClear options={PAYMENT_TERM_OPTIONS} />
          </Form.Item>

          <Form.Item
            label="Salida de tesorería"
            name={['conditions', 'settlementKind']}
          >
            <Select allowClear options={SETTLEMENT_KIND_OPTIONS} />
          </Form.Item>

          <Form.Item
            label="Tratamiento fiscal"
            name={['conditions', 'taxTreatment']}
          >
            <Select allowClear options={TAX_TREATMENT_OPTIONS} />
          </Form.Item>
        </ThreeColumnGrid>

        <Form.List name="linesTemplate">
          {(fields, { add, remove }) => (
            <div style={{ marginTop: 24 }}>
              <SectionHeader style={{ marginBottom: 16 }}>
                <Text strong>Estructura del asiento</Text>
                <Button
                  type="primary"
                  ghost
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      side: 'debit',
                      amountSource: 'document_total',
                      omitIfZero: true,
                    })
                  }
                >
                  Agregar línea
                </Button>
              </SectionHeader>

              <TableContainer>
                <TableHeader>
                  <HeaderCol flex="100px">Lado</HeaderCol>
                  <HeaderCol flex="1">Cuenta contable</HeaderCol>
                  <HeaderCol flex="180px">Fuente de monto</HeaderCol>
                  <HeaderCol flex="100px" center>
                    Omitir 0
                  </HeaderCol>
                  <HeaderCol flex="40px" />
                </TableHeader>

                <div className="table-body">
                  {fields.map((field) => (
                    <LineRowContainer key={field.key}>
                      <LineRow>
                        <Form.Item
                          noStyle
                          name={[field.name, 'side']}
                          rules={[
                            { required: true, message: 'Seleccione el lado.' },
                          ]}
                        >
                          <Select
                            variant="borderless"
                            popupMatchSelectWidth={false}
                            options={[
                              { label: 'Débito', value: 'debit' },
                              { label: 'Crédito', value: 'credit' },
                            ]}
                          />
                        </Form.Item>

                        <Form.Item
                          noStyle
                          name={[field.name, 'accountId']}
                          rules={[
                            { required: true, message: 'Seleccione la cuenta.' },
                          ]}
                        >
                          <Select
                            showSearch
                            variant="borderless"
                            placeholder="Buscar cuenta..."
                            optionFilterProp="label"
                            options={accountOptions}
                          />
                        </Form.Item>

                        <Form.Item
                          noStyle
                          name={[field.name, 'amountSource']}
                          rules={[
                            {
                              required: true,
                              message: 'Seleccione la fuente del monto.',
                            },
                          ]}
                        >
                          <Select
                            variant="borderless"
                            options={AMOUNT_SOURCE_OPTIONS}
                          />
                        </Form.Item>

                        <Form.Item
                          noStyle
                          name={[field.name, 'omitIfZero']}
                          valuePropName="checked"
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Checkbox />
                          </div>
                        </Form.Item>

                        <Space size={0}>
                          <Form.Item noStyle shouldUpdate>
                            {() => {
                              const hasDescription = !!form.getFieldValue([
                                'linesTemplate',
                                field.name,
                                'description',
                              ]);
                              return (
                                <Tooltip title="Agregar detalle">
                                  <Button
                                    type="text"
                                    icon={<InfoCircleOutlined />}
                                    style={{
                                      color: hasDescription
                                        ? '#1890ff'
                                        : '#bfbfbf',
                                    }}
                                    onClick={() => {
                                      // Toggle description logic or just let the field exist
                                      // Here we just show it if button clicked or always show it below?
                                      // The user said "ocúltalo detrás de un botoncito"
                                      const current = form.getFieldValue([
                                        'linesTemplate',
                                        field.name,
                                        '_showDetail',
                                      ]);
                                      form.setFieldValue(
                                        ['linesTemplate', field.name, '_showDetail'],
                                        !current,
                                      );
                                    }}
                                  />
                                </Tooltip>
                              );
                            }}
                          </Form.Item>

                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            disabled={fields.length <= 2}
                            onClick={() => remove(field.name)}
                          />
                        </Space>
                      </LineRow>

                      <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) =>
                          prev.linesTemplate?.[field.name]?._showDetail !==
                          curr.linesTemplate?.[field.name]?._showDetail
                        }
                      >
                        {() => {
                          const showDetail = form.getFieldValue([
                            'linesTemplate',
                            field.name,
                            '_showDetail',
                          ]);
                          const hasDescription = !!form.getFieldValue([
                            'linesTemplate',
                            field.name,
                            'description',
                          ]);

                          if (!showDetail && !hasDescription) return null;

                          return (
                            <DetailRow>
                              <Form.Item
                                name={[field.name, 'description']}
                                noStyle
                              >
                                <Input
                                  placeholder="Nota opcional para esta línea (impuesto, principal, etc.)"
                                  variant="borderless"
                                  style={{
                                    borderBottom: '1px dashed #d9d9d9',
                                    padding: '0 4px',
                                  }}
                                />
                              </Form.Item>
                            </DetailRow>
                          );
                        }}
                      </Form.Item>
                    </LineRowContainer>
                  ))}
                </div>
              </TableContainer>
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 24px;
`;

const ThreeColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 16px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const HeaderMetaWrapper = styled.div`
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid #f0f0f0;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  margin-bottom: 12px;
  padding-bottom: 4px;
  border-bottom: 1px solid #f0f0f0;
`;

// Estilos de la Tabla Contable
const TableContainer = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 100px 1fr 180px 100px 80px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 12px;
`;

const HeaderCol = styled.div<{ flex: string; center?: boolean }>`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  text-align: ${(props) => (props.center ? 'center' : 'left')};
`;

const LineRowContainer = styled.div`
  border-bottom: 1px solid #f0f0f0;
  &:last-child {
    border-bottom: none;
  }
`;

const LineRow = styled.div`
  display: grid;
  grid-template-columns: 100px 1fr 180px 100px 80px;
  align-items: center;
  padding: 4px 12px;
  background: #fff;

  .ant-select-selector {
    padding: 0 4px !important;
  }

  &:hover {
    background: #fafafa;
  }
`;

const DetailRow = styled.div`
  padding: 4px 12px 12px 112px;
  background: #fff;
`;
