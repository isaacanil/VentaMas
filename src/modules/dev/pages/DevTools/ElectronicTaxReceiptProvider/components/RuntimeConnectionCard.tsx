import { Label, ListBox, ListBoxItem } from '@heroui/react';
import { Form } from 'antd';
import type { FormInstance } from 'antd';
import type { Key } from 'react';
import styled from 'styled-components';

import {
  VmButton,
  VmCard,
  VmInput,
  VmNumberField,
  VmSelect,
  VmSwitch,
} from '@/components/heroui';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  ApiOutlined,
  SaveOutlined,
} from '@/constants/icons/antd';
import {
  StatusBadge,
  type StatusBadgeTone,
} from '@/components/ui/StatusBadge';
import type { ElectronicTaxReceiptReadinessCheck } from '@/firebase/electronicTaxReceipts/fbValidateElectronicTaxReceiptConfig';
import type { ValidateElectronicTaxReceiptPlatformConfigResult } from '@/firebase/electronicTaxReceipts/fbValidateElectronicTaxReceiptPlatformConfig';

import type { PlatformConfigFormValues } from '../types';
import {
  getCheckByKey,
  getCheckStatusMeta,
  getRuntimeStatusMeta,
  MODE_OPTIONS,
  type RuntimeModeOption,
} from '../utils/runtimeProviderMeta';

interface RuntimeConnectionCardProps {
  form: FormInstance<PlatformConfigFormValues>;
  result: ValidateElectronicTaxReceiptPlatformConfigResult | null;
  saving: boolean;
  checking: boolean;
  loadingSavedConfig: boolean;
  onSave: () => void;
  onValidate: () => void;
}

type RuntimeModeSelectProps = {
  value?: RuntimeModeOption;
  onChange?: (value: RuntimeModeOption) => void;
  disabled?: boolean;
};

type RuntimeNumberFieldProps = {
  value?: number | null;
  onChange?: (value?: number) => void;
  disabled?: boolean;
};

export const RuntimeConnectionCard = ({
  checking,
  form,
  loadingSavedConfig,
  result,
  saving,
  onSave,
  onValidate,
}: RuntimeConnectionCardProps) => {
  const runtimeMeta = getRuntimeStatusMeta(result?.status);
  const baseUrlCheck = getCheckByKey(result?.checks, 'base-url');
  const instanceCheck = getCheckByKey(result?.checks, 'integration-instance');
  const preparationCheck = getCheckByKey(result?.checks, 'preparation');
  const modeCheck = getCheckByKey(result?.checks, 'mode');
  const tokenCheck = getCheckByKey(result?.checks, 'token');
  const timeoutCheck = getCheckByKey(result?.checks, 'timeout');
  const healthCheck = getCheckByKey(result?.checks, 'remote-health');
  const healthMeta = healthCheck
    ? getCheckStatusMeta(healthCheck.status)
    : { label: 'Pendiente', tone: 'neutral' as StatusBadgeTone };
  const formDisabled = loadingSavedConfig;

  return (
    <RuntimeCard variant="secondary">
      <CardHeader>
        <PanelTitleGroup>
          <IconBox>
            <ApiOutlined />
          </IconBox>
          <div>
            <SectionTitle>Conexion global VentaMax - GISYS</SectionTitle>
            <SectionDescription>
              Runtime, instancia y etapa de envio compartidos por todos los
              negocios
            </SectionDescription>
          </div>
        </PanelTitleGroup>
        <StatusBadge
          icon={getStatusIcon(runtimeMeta.tone)}
          label={runtimeMeta.label}
          size="sm"
          tone={runtimeMeta.tone}
          variant="outline"
        />
      </CardHeader>

      <CardDivider />

      <Form
        colon={false}
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          baseUrl: '',
          integrationInstanceCode: '',
          electronicModelEnabled: false,
          mode: 'shadow',
          timeoutMs: 20000,
        }}
      >
        <RuntimeFormGrid>
          <Form.Item
            name="baseUrl"
            label={<FieldLabel check={baseUrlCheck}>Base URL</FieldLabel>}
          >
            <ControlInput
              aria-label="Base URL"
              disabled={formDisabled}
              fullWidth
              placeholder="https://api.gisys.net"
            />
          </Form.Item>

          <Form.Item
            label={
              <FieldLabel check={tokenCheck}>Secret de Functions</FieldLabel>
            }
          >
            <ControlInput
              aria-label="Secret de Functions"
              disabled={formDisabled}
              fullWidth
              readOnly
              value={result?.runtime.tokenEnvName || 'GISYS_FACT_CLIENT_TOKEN'}
            />
          </Form.Item>

          <Form.Item
            name="integrationInstanceCode"
            label={
              <FieldLabel check={instanceCheck}>Instancia GISYS</FieldLabel>
            }
          >
            <ControlInput
              aria-label="Instancia GISYS"
              disabled={formDisabled}
              fullWidth
              placeholder="ventamax-0001-test"
            />
          </Form.Item>

          <Form.Item
            name="electronicModelEnabled"
            valuePropName="isSelected"
            label={
              <FieldLabel check={preparationCheck}>Preparar e-CF</FieldLabel>
            }
          >
            <RuntimeSwitch isDisabled={formDisabled}>Activo</RuntimeSwitch>
          </Form.Item>

          <Form.Item
            name="mode"
            label={<FieldLabel check={modeCheck}>Etapa de envio</FieldLabel>}
          >
            <RuntimeModeSelect disabled={formDisabled} />
          </Form.Item>

          <Form.Item
            name="timeoutMs"
            label={<FieldLabel check={timeoutCheck}>Timeout</FieldLabel>}
          >
            <RuntimeNumberField disabled={formDisabled} />
          </Form.Item>
        </RuntimeFormGrid>
      </Form>

      <CardDivider />

      <FooterRow>
        <HealthBlock>
          <HealthTitleRow>
            <HealthTitle>
              <GlobalOutlined />
              Health GISYS
            </HealthTitle>
            <StatusBadge
              label={healthMeta.label}
              size="sm"
              tone={healthMeta.tone}
              variant="outline"
            />
          </HealthTitleRow>
          <HealthDetail>
            {healthCheck?.detail || 'Valida el runtime global para probar GISYS.'}
          </HealthDetail>
        </HealthBlock>

        <Actions>
          <ActionButton
            isDisabled={checking || formDisabled}
            isPending={saving}
            variant="outline"
            onPress={onSave}
          >
            <SaveOutlined />
            Guardar configuracion
          </ActionButton>
          <ActionButton
            isDisabled={formDisabled}
            isPending={checking}
            variant="primary"
            onPress={onValidate}
          >
            <CheckCircleOutlined />
            Validar runtime global
          </ActionButton>
        </Actions>
      </FooterRow>
    </RuntimeCard>
  );
};

const RuntimeModeSelect = ({
  disabled,
  onChange,
  value,
}: RuntimeModeSelectProps) => {
  const handleSelectionChange = (key: Key | null) => {
    const nextValue = String(key || 'shadow');
    const validOption = MODE_OPTIONS.find(
      (option) => option.value === nextValue,
    );

    if (validOption) onChange?.(validOption.value);
  };

  return (
    <SelectControl
      fullWidth
      isDisabled={disabled}
      selectedKey={value || 'shadow'}
      onSelectionChange={handleSelectionChange}
    >
      <HiddenLabel>Etapa de envio</HiddenLabel>
      <VmSelect.Trigger>
        <VmSelect.Value />
        <VmSelect.Indicator />
      </VmSelect.Trigger>
      <VmSelect.Popover>
        <ListBox aria-label="Etapa de envio" items={MODE_OPTIONS}>
          {(option) => (
            <ListBoxItem id={option.value} textValue={option.label}>
              {option.label}
              <ListBoxItem.Indicator />
            </ListBoxItem>
          )}
        </ListBox>
      </VmSelect.Popover>
    </SelectControl>
  );
};

const RuntimeNumberField = ({
  disabled,
  onChange,
  value,
}: RuntimeNumberFieldProps) => (
  <TimeoutNumberField
    aria-label="Timeout"
    formatOptions={{ useGrouping: false }}
    fullWidth
    isDisabled={disabled}
    maxValue={120000}
    minValue={5000}
    step={1000}
    value={typeof value === 'number' ? value : undefined}
    onChange={onChange}
  >
    <TimeoutNumberGroup>
      <VmNumberField.Input />
      <TimeoutUnit>ms</TimeoutUnit>
    </TimeoutNumberGroup>
  </TimeoutNumberField>
);

const FieldLabel = ({
  check,
  children,
}: {
  check?: ElectronicTaxReceiptReadinessCheck | null;
  children: string;
}) => (
  <FieldLabelRow>
    <span>{children}</span>
    {check ? <FieldSignal check={check} /> : null}
  </FieldLabelRow>
);

const FieldSignal = ({
  check,
}: {
  check: ElectronicTaxReceiptReadinessCheck;
}) => {
  const meta = getCheckStatusMeta(check.status);

  return (
    <StatusBadge
      label={meta.label}
      size="sm"
      tone={meta.tone}
      variant="subtle"
    />
  );
};

const getStatusIcon = (tone: StatusBadgeTone) => {
  if (tone === 'success') return <CheckCircleOutlined />;
  if (tone === 'warning' || tone === 'danger') {
    return <ExclamationCircleOutlined />;
  }
  return null;
};

const RuntimeCard = styled(VmCard)`
  display: grid;
  gap: 0;
  overflow: hidden;
  padding: 0;
  background: var(--ds-color-bg-surface);
`;

const CardHeader = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--ds-space-4);

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const PanelTitleGroup = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: flex-start;
  min-width: 0;
`;

const IconBox = styled.div`
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-interactive-selected-text);
  background: var(--ds-color-interactive-selected-bg);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-primary);
`;

const SectionDescription = styled.p`
  margin: var(--ds-space-1) 0 0;
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const CardDivider = styled.div`
  height: 1px;
  background: var(--ds-color-border-default);
`;

const RuntimeFormGrid = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: var(--ds-space-4);

  .ant-form-item {
    margin: 0;
  }

  .ant-form-item-label {
    padding: 0 0 var(--ds-space-1);
  }

  .ant-form-item-label > label {
    width: 100%;
    min-width: 0;
    height: auto;
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-semibold);
  }

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const FieldLabelRow = styled.span`
  display: flex;
  width: 100%;
  min-width: 0;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: space-between;
`;

const ControlInput = styled(VmInput)`
  width: 100%;
  min-width: 0;
  font-family: var(--ds-font-family-mono);
`;

const RuntimeSwitch = styled(VmSwitch)`
  min-height: 36px;
`;

const SelectControl = styled(VmSelect)`
  width: 100%;
  min-width: 0;
`;

const HiddenLabel = styled(Label)`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const TimeoutNumberField = styled(VmNumberField)`
  width: 100%;
`;

const TimeoutNumberGroup = styled(VmNumberField.Group)`
  min-height: 36px;
`;

const TimeoutUnit = styled.span`
  display: inline-flex;
  align-items: center;
  align-self: stretch;
  padding: 0 var(--ds-space-3);
  border-left: 1px solid var(--ds-color-border-default);
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
  background: var(--ds-color-bg-subtle);
`;

const FooterRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-4);
  align-items: end;
  padding: var(--ds-space-4);

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const HealthBlock = styled.div`
  display: grid;
  min-width: 0;
  gap: var(--ds-space-2);
`;

const HealthTitleRow = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  align-items: center;
  flex-wrap: wrap;
`;

const HealthTitle = styled.h3`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  margin: 0;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const HealthDetail = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const Actions = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  justify-content: flex-end;
  flex-wrap: wrap;

  @media (max-width: 620px) {
    width: 100%;

    > button {
      flex: 1 1 100%;
    }
  }
`;

const ActionButton = styled(VmButton)`
  white-space: nowrap;
`;
