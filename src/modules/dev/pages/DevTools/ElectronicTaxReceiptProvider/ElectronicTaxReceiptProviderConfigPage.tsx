import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import {
  fbValidateElectronicTaxReceiptPlatformConfig,
  type ValidateElectronicTaxReceiptPlatformConfigResult,
} from '@/firebase/electronicTaxReceipts/fbValidateElectronicTaxReceiptPlatformConfig';
import { fbUpdateElectronicTaxReceiptPlatformConfig } from '@/firebase/electronicTaxReceipts/fbUpdateElectronicTaxReceiptPlatformConfig';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import ROUTES_NAME from '@/router/routes/routesName';

import { RuntimeConnectionCard } from './components/RuntimeConnectionCard';
import { RuntimeDeveloperNotice } from './components/RuntimeDeveloperNotice';
import type { PlatformConfigFormValues } from './types';

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
        message.warning('La conexion global GISYS necesita revision.');
        return;
      }
      message.success('Conexion global GISYS validada.');
    } catch (error: any) {
      message.error(
        error?.message || 'No se pudo validar la conexion global GISYS.',
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

  return (
    <Wrapper>
      <MenuApp
        sectionName="Runtime e-CF GISYS"
        showBackButton
        onBackClick={() => navigate(ROUTES_NAME.BASIC_TERM.DEVELOPER_HUB)}
      />

      <Content>
        <Header>
          <HeaderTitle>Runtime e-CF GISYS</HeaderTitle>
          <HeaderDescription>
            Configuracion global de VentaMax para conectar con GISYS
          </HeaderDescription>
        </Header>

        <RuntimeDeveloperNotice />

        <RuntimeConnectionCard
          checking={checking}
          form={form}
          loadingSavedConfig={loadingSavedConfig}
          result={result}
          saving={saving}
          onSave={handleSavePlatform}
          onValidate={handleValidatePlatform}
        />
      </Content>
    </Wrapper>
  );
};

export default ElectronicTaxReceiptProviderConfigPage;

const Wrapper = styled.div`
  min-height: 100%;
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-page);
`;

const Content = styled.main`
  display: grid;
  width: min(100%, 1180px);
  gap: var(--ds-space-4);
  margin-inline: auto;
  padding: var(--ds-space-5);
`;

const Header = styled.header`
  display: grid;
  gap: var(--ds-space-1);
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const HeaderDescription = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;
