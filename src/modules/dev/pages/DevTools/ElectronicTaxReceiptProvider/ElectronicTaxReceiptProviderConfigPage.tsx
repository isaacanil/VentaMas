import { ApiOutlined, CheckCircleOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import {
  fbValidateElectronicTaxReceiptPlatformConfig,
  type ValidateElectronicTaxReceiptPlatformConfigResult,
} from '@/firebase/electronicTaxReceipts/fbValidateElectronicTaxReceiptPlatformConfig';
import {
  fbUpdateElectronicTaxReceiptPlatformConfig,
  type UpdateElectronicTaxReceiptPlatformConfigInput,
} from '@/firebase/electronicTaxReceipts/fbUpdateElectronicTaxReceiptPlatformConfig';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import ROUTES_NAME from '@/router/routes/routesName';

const { Text, Title } = Typography;

const STATUS_META: Record<string, { label: string; color: string }> = {
  ready: { label: 'Runtime listo', color: 'green' },
  blocked: { label: 'Revisar runtime', color: 'red' },
  inactive: { label: 'Inactivo', color: 'default' },
  shadow_ready: { label: 'Sin health remoto', color: 'gold' },
};

const CHECK_STATUS_META = {
  passed: { label: 'OK', color: 'green' },
  warning: { label: 'Revisar', color: 'gold' },
  blocked: { label: 'Bloqueado', color: 'red' },
  inactive: { label: 'Inactivo', color: 'default' },
} as const;

const MODE_OPTIONS = [
  { label: 'Preparacion solamente', value: 'shadow' },
  { label: 'Piloto', value: 'pilot' },
  { label: 'Envio activo', value: 'required' },
];

type PlatformConfigFormValues = UpdateElectronicTaxReceiptPlatformConfigInput;

const ElectronicTaxReceiptProviderConfigPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<PlatformConfigFormValues>();
  const [checking, setChecking] = useState(false);
  const [loadingSavedConfig, setLoadingSavedConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] =
    useState<ValidateElectronicTaxReceiptPlatformConfigResult | null>(null);

  const fillFormFromRuntime = useCallback(
    (runtime: ValidateElectronicTaxReceiptPlatformConfigResult['runtime']) => {
      form.setFieldsValue({
        baseUrl: runtime.baseUrl || '',
        integrationInstanceCode: runtime.integrationInstanceCode || '',
        electronicModelEnabled: runtime.electronicPreparationEnabled,
        mode: runtime.mode || 'shadow',
        timeoutMs: runtime.timeoutMs || 20000,
      });
    },
    [form],
  );

  useEffect(() => {
    let isCurrent = true;

    const loadSavedConfig = async () => {
      try {
        const nextResult = await fbValidateElectronicTaxReceiptPlatformConfig({
          checkRemote: false,
        });
        if (!isCurrent) return;

        setResult(nextResult);
        fillFormFromRuntime(nextResult.runtime);
      } catch (error: any) {
        if (!isCurrent) return;

        message.error(
          error?.message || 'No se pudo cargar la configuracion global GISYS.',
        );
      } finally {
        if (isCurrent) setLoadingSavedConfig(false);
      }
    };

    void loadSavedConfig();

    return () => {
      isCurrent = false;
    };
  }, [fillFormFromRuntime]);

  const handleValidatePlatform = async () => {
    setChecking(true);
    try {
      const nextResult = await fbValidateElectronicTaxReceiptPlatformConfig({
        checkRemote: true,
      });
      setResult(nextResult);
      fillFormFromRuntime(nextResult.runtime);
      if (nextResult.status === 'blocked') {
        message.warning('La conexión global GISYS necesita revisión.');
        return;
      }
      message.success('Conexión global GISYS validada.');
    } catch (error: any) {
      message.error(
        error?.message || 'No se pudo validar la conexión global GISYS.',
      );
    } finally {
      setChecking(false);
    }
  };

  const handleSavePlatform = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await fbUpdateElectronicTaxReceiptPlatformConfig({
        ...values,
        checkRemote: true,
      });
      const nextResult = await fbValidateElectronicTaxReceiptPlatformConfig({
        checkRemote: true,
      });
      setResult(nextResult);
      fillFormFromRuntime(nextResult.runtime);
      message.success('Configuracion global GISYS guardada.');
    } catch (error: any) {
      if (Array.isArray(error?.errorFields)) return;

      const details = error?.details?.issues?.join(', ');
      message.error(
        details
          ? `Configuracion incompleta: ${details}`
          : error?.message || 'No se pudo guardar la configuracion global.',
      );
    } finally {
      setSaving(false);
    }
  };

  const statusMeta = result
    ? STATUS_META[result.status] || STATUS_META.blocked
    : { label: 'Pendiente de validar', color: 'default' };

  return (
    <Wrapper>
      <MenuApp
        sectionName="Runtime e-CF GISYS"
        showBackButton
        onBackClick={() => navigate(ROUTES_NAME.BASIC_TERM.DEVELOPER_HUB)}
      />

      <Content>
        <Header>
          <div>
            <Title level={3}>Runtime e-CF GISYS</Title>
            <Text>
              Configuracion global de VentaMax para conectar con GISYS.
            </Text>
          </div>
        </Header>

        <Alert
          type="info"
          showIcon
          message="Esta pantalla es solo para desarrolladores."
          description="Base URL, secret, instancia GISYS, preparacion e-CF, etapa de envio y timeout son parametros globales de VentaMax/Functions para el proveedor GISYS."
        />

        <Panel>
          <PanelHeader>
            <PanelTitleGroup>
              <IconBox>
                <ApiOutlined />
              </IconBox>
              <div>
                <SectionTitle>Conexion global VentaMax a GISYS</SectionTitle>
                <SectionDescription>
                  Runtime, instancia y etapa de envio compartidos por todos los
                  negocios.
                </SectionDescription>
              </div>
            </PanelTitleGroup>
            <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
          </PanelHeader>

          <Form
            form={form}
            disabled={loadingSavedConfig}
            layout="vertical"
            initialValues={{
              baseUrl: '',
              integrationInstanceCode: '',
              electronicModelEnabled: false,
              mode: 'shadow',
              timeoutMs: 20000,
            }}
          >
            <RuntimeFormGrid>
              <Form.Item name="baseUrl" label="Base URL">
                <Input placeholder="https://gisys.example/api/v1" />
              </Form.Item>
              <Form.Item label="Secret de Functions">
                <Input
                  readOnly
                  value={
                    result?.runtime.tokenEnvName || 'GISYS_FACT_CLIENT_TOKEN'
                  }
                />
              </Form.Item>
              <Form.Item name="integrationInstanceCode" label="Instancia GISYS">
                <Input placeholder="ventamax-0001-test" />
              </Form.Item>
              <Form.Item
                name="electronicModelEnabled"
                label="Preparar e-CF"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item name="mode" label="Etapa de envio">
                <Select options={MODE_OPTIONS} />
              </Form.Item>
              <Form.Item name="timeoutMs" label="Timeout">
                <InputNumber
                  min={5000}
                  max={120000}
                  step={1000}
                  addonAfter="ms"
                />
              </Form.Item>
            </RuntimeFormGrid>
          </Form>

          <Actions>
            <Button
              loading={saving}
              disabled={checking || loadingSavedConfig}
              onClick={handleSavePlatform}
            >
              Guardar configuracion global
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={checking}
              disabled={loadingSavedConfig}
              onClick={handleValidatePlatform}
            >
              Validar runtime global
            </Button>
          </Actions>

          {result ? (
            <CheckList>
              {result.checks.map((check) => {
                const meta = CHECK_STATUS_META[check.status];
                return (
                  <CheckItem key={check.key}>
                    <CheckTitleRow>
                      <CheckLabel>{check.label}</CheckLabel>
                      <Tag color={meta.color}>{meta.label}</Tag>
                    </CheckTitleRow>
                    {check.detail ? (
                      <CheckDetail>{check.detail}</CheckDetail>
                    ) : null}
                  </CheckItem>
                );
              })}
            </CheckList>
          ) : (
            <Alert
              type="info"
              showIcon
              message="Valida el runtime global antes de poner negocios en piloto o envío activo."
            />
          )}
        </Panel>
      </Content>
    </Wrapper>
  );
};

export default ElectronicTaxReceiptProviderConfigPage;

const Wrapper = styled.div`
  min-height: 100%;
  background: var(--ds-color-bg-page);
`;

const Content = styled.main`
  display: grid;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5);
`;

const Header = styled.header`
  display: flex;
  gap: var(--ds-space-4);
  align-items: flex-start;
  justify-content: space-between;

  h3 {
    margin: 0 0 var(--ds-space-1);
  }

  @media (max-width: 760px) {
    flex-direction: column;
  }
`;

const Panel = styled.section`
  display: grid;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const PanelHeader = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: flex-start;
  justify-content: space-between;
`;

const PanelTitleGroup = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: flex-start;
  min-width: 0;
`;

const IconBox = styled.div`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-action-primary);
  background: var(--ds-color-bg-subtle);
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const SectionDescription = styled.p`
  margin: var(--ds-space-1) 0 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const RuntimeFormGrid = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  align-items: start;

  .ant-input-number {
    width: 100%;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const CheckList = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const CheckItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const CheckTitleRow = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: space-between;
`;

const CheckLabel = styled.span`
  min-width: 0;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const CheckDetail = styled.span`
  min-width: 0;
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
  overflow-wrap: anywhere;
`;
