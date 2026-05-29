import { Alert, Form, message } from 'antd';
import { useMemo, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

import { ApiOutlined } from '@/constants/icons/antd';
import {
  VmButton,
  VmCard,
  VmDrawer,
  VmInput,
  VmModal,
  VmSwitch,
} from '@/components/heroui';
import { fbUpdateElectronicTaxReceiptConfig } from '@/firebase/electronicTaxReceipts/fbUpdateElectronicTaxReceiptConfig';
import useViewportWidth from '@/hooks/windows/useViewportWidth';

import {
  resolveElectronicTaxReceiptBusinessLinkValues,
  type BusinessFiscalConfig,
} from './utils/providerConfig';

type Props = {
  businessId?: string | null;
  business?: BusinessFiscalConfig | null;
  taxReceiptEnabled?: boolean;
  modalOpen?: boolean;
  onModalOpenChange?: (open: boolean) => void;
};

type TaxpayerFormValues = {
  electronicModelEnabled: boolean;
  taxpayerCode: string;
};

export const ElectronicTaxReceiptBusinessLinkSection = ({
  businessId,
  business,
  taxReceiptEnabled,
  modalOpen: controlledModalOpen,
  onModalOpenChange,
}: Props) => {
  const viewportWidth = useViewportWidth();
  const [form] = Form.useForm<TaxpayerFormValues>();
  const [saving, setSaving] = useState(false);
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const currentValues = useMemo(
    () => resolveElectronicTaxReceiptBusinessLinkValues(business),
    [business],
  );
  const taxpayerConfigured = Boolean(currentValues.taxpayerCode);
  const electronicModelEnabled = currentValues.electronicModelEnabled;
  const statusMeta = getBusinessLinkStatus({
    electronicModelEnabled,
    taxReceiptEnabled: Boolean(taxReceiptEnabled),
    taxpayerConfigured,
  });
  const isMobileDrawer = viewportWidth <= 640;
  const modalOpen = controlledModalOpen ?? internalModalOpen;
  const formKey = `${businessId || 'no-business'}:${
    currentValues.taxpayerCode || 'empty'
  }:${electronicModelEnabled ? 'ecf-on' : 'ecf-off'}`;

  const handleModalOpenChange = (nextOpen: boolean) => {
    if (onModalOpenChange) {
      onModalOpenChange(nextOpen);
      return;
    }

    setInternalModalOpen(nextOpen);
  };

  const handleSaveTaxpayer = async (values: TaxpayerFormValues) => {
    if (!businessId) {
      message.error('No se encontro el negocio activo.');
      return;
    }
    if (values.electronicModelEnabled && !taxReceiptEnabled) {
      message.error('Habilita los comprobantes fiscales antes de activar e-CF.');
      return;
    }

    setSaving(true);
    try {
      await fbUpdateElectronicTaxReceiptConfig({
        scope: 'business-taxpayer',
        businessId,
        electronicModelEnabled: Boolean(values.electronicModelEnabled),
        taxpayerCode: values.taxpayerCode,
      });
      message.success(
        values.electronicModelEnabled
          ? 'Contribuyente GISYS y e-CF activados.'
          : 'Contribuyente GISYS guardado.',
      );
    } catch (error: any) {
      const details = error?.details?.issues?.join(', ');
      message.error(
        details
          ? `Contribuyente incompleto: ${details}`
          : error?.message || 'No se pudo guardar el contribuyente GISYS.',
      );
    } finally {
      setSaving(false);
    }
  };

  const editorContent = (
    <ModalContent>
      <Alert
        type={taxReceiptEnabled ? 'info' : 'warning'}
        showIcon
        message={getBusinessLinkGuidance({
          electronicModelEnabled,
          taxReceiptEnabled: Boolean(taxReceiptEnabled),
          taxpayerConfigured,
        })}
      />

      <ProviderPanel>
        <ProviderItem>
          <ReadOnlyLabel>Proveedor</ReadOnlyLabel>
          <ReadOnlyValue>GISYS</ReadOnlyValue>
        </ProviderItem>

        <Form
          key={formKey}
          form={form}
          layout="vertical"
          initialValues={{
            electronicModelEnabled,
            taxpayerCode: currentValues.taxpayerCode,
          }}
          onFinish={handleSaveTaxpayer}
        >
          <ElectronicActivationRow>
            <ElectronicActivationCopy>
              <ReadOnlyLabel>Activar e-CF</ReadOnlyLabel>
            </ElectronicActivationCopy>
            <Form.Item
              name="electronicModelEnabled"
              valuePropName="isSelected"
              noStyle
            >
              <ElectronicSwitch
                aria-label="Activar e-CF para este negocio"
                isDisabled={!taxReceiptEnabled}
              />
            </Form.Item>
          </ElectronicActivationRow>

          <Form.Item
            name="taxpayerCode"
            label="Contribuyente GISYS"
            rules={[
              {
                required: true,
                message: 'Indica el contribuyente GISYS del negocio.',
              },
            ]}
          >
            <VmInput placeholder="RNC o codigo de contribuyente" />
          </Form.Item>

          <Actions>
            <VmButton
              variant="primary"
              type="submit"
              isPending={saving}
              isDisabled={!businessId}
            >
              Guardar contribuyente
            </VmButton>
          </Actions>
        </Form>
      </ProviderPanel>
    </ModalContent>
  );

  return (
    <>
      <CompactPanel>
        <WidgetMainRow>
          <WidgetHeader>
            <WidgetIdentity>
              <WidgetIcon>
                <ApiOutlined />
              </WidgetIcon>
              <WidgetCopy>
                <WidgetEyebrow>Proveedor e-CF</WidgetEyebrow>
                <SectionTitle>GISYS</SectionTitle>
              </WidgetCopy>
            </WidgetIdentity>
            <WidgetStatus data-tone={statusMeta.tone}>
              {statusMeta.label}
            </WidgetStatus>
          </WidgetHeader>

          <CompactActions>
            <VmButton
              variant="outline"
              onPress={() => handleModalOpenChange(true)}
            >
              Configurar contribuyente
            </VmButton>
          </CompactActions>
        </WidgetMainRow>
      </CompactPanel>

      {isMobileDrawer ? (
        <VmDrawer
          isOpen={modalOpen}
          title="Proveedor e-CF GISYS"
          placement="bottom"
          dialogClassName="electronic-tax-receipt-link-drawer"
          onOpenChange={handleModalOpenChange}
        >
          <ModalLayoutStyles />
          {editorContent}
        </VmDrawer>
      ) : (
        <VmModal
          isOpen={modalOpen}
          title="Proveedor e-CF GISYS"
          size="lg"
          dialogClassName="electronic-tax-receipt-link-dialog"
          onOpenChange={handleModalOpenChange}
        >
          <ModalLayoutStyles />
          {editorContent}
        </VmModal>
      )}
    </>
  );
};

const getBusinessLinkStatus = ({
  electronicModelEnabled,
  taxReceiptEnabled,
  taxpayerConfigured,
}: {
  electronicModelEnabled: boolean;
  taxReceiptEnabled: boolean;
  taxpayerConfigured: boolean;
}) => {
  if (!taxReceiptEnabled)
    return { label: 'NCF pendiente', color: 'default', tone: 'neutral' };
  if (!taxpayerConfigured) {
    return {
      label: 'Contribuyente pendiente',
      color: 'default',
      tone: 'warning',
    };
  }
  if (!electronicModelEnabled) {
    return {
      label: 'e-CF pendiente',
      color: 'default',
      tone: 'warning',
    };
  }
  return {
    label: 'e-CF activo',
    color: 'green',
    tone: 'success',
  };
};

const getBusinessLinkGuidance = ({
  electronicModelEnabled,
  taxReceiptEnabled,
  taxpayerConfigured,
}: {
  electronicModelEnabled: boolean;
  taxReceiptEnabled: boolean;
  taxpayerConfigured: boolean;
}) => {
  if (!taxReceiptEnabled) {
    return 'Registra el contribuyente GISYS; VentaMax activara e-CF cuando los comprobantes fiscales del negocio esten listos.';
  }
  if (!taxpayerConfigured) {
    return 'Registra el contribuyente que GISYS usara para identificar fiscalmente este negocio.';
  }
  if (electronicModelEnabled) {
    return 'El contribuyente esta registrado y e-CF esta activo para este negocio.';
  }
  return 'El contribuyente esta registrado. Activa e-CF para que el selector de ventas muestre los comprobantes electronicos.';
};

const ModalLayoutStyles = createGlobalStyle`
  .electronic-tax-receipt-link-dialog {
    width: min(560px, calc(100vw - 32px));
    max-width: calc(100vw - 32px);
    overflow: hidden;
  }

  .electronic-tax-receipt-link-drawer {
    width: 100vw;
    max-width: 100vw;
    max-height: min(92vh, calc(100dvh - 16px));
    border-radius: var(--ds-radius-xl) var(--ds-radius-xl) 0 0;
    overflow: hidden;
  }

  .electronic-tax-receipt-link-dialog [data-slot='body'],
  .electronic-tax-receipt-link-dialog [data-component='modal-body'],
  .electronic-tax-receipt-link-drawer [data-slot='body'],
  .electronic-tax-receipt-link-drawer [data-component='drawer-body'] {
    min-width: 0;
    max-width: 100%;
    overflow-x: hidden;
  }

  .electronic-tax-receipt-link-drawer [data-slot='body'],
  .electronic-tax-receipt-link-drawer [data-component='drawer-body'] {
    overflow-y: auto;
  }

  @media (max-width: 560px) {
    .electronic-tax-receipt-link-dialog {
      width: calc(100vw - 24px);
      max-width: calc(100vw - 24px);
    }
  }
`;

const CompactPanel = styled(VmCard)`
  display: grid;
  padding: var(--ds-space-4);
  background: var(--ds-color-bg-surface);
`;

const WidgetMainRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-3);
  align-items: center;
  min-width: 0;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: var(--ds-space-2);
  }
`;

const WidgetHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  flex-wrap: wrap;
  min-width: 0;
`;

const WidgetIdentity = styled.div`
  display: flex;
  flex: 1 1 220px;
  align-items: center;
  gap: var(--ds-space-3);
  min-width: 0;
`;

const WidgetIcon = styled.span`
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-interactive-selected-text);
  background: var(--ds-color-interactive-selected-bg);
`;

const WidgetCopy = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

const WidgetEyebrow = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  letter-spacing: 0;
  text-transform: uppercase;
  color: var(--ds-color-text-tertiary);
`;

const WidgetStatus = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  min-height: 26px;
  padding: 0 var(--ds-space-2);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-secondary);
  background: var(--ds-color-bg-subtle);

  &[data-tone='warning'] {
    border-color: var(--ds-color-state-warning);
    color: var(--ds-color-state-warning-text);
    background: var(--ds-color-state-warning-subtle);
  }

  &[data-tone='success'] {
    border-color: var(--ds-color-state-success);
    color: var(--ds-color-state-success-text);
    background: var(--ds-color-state-success-subtle);
  }
`;

const CompactActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 480px) {
    justify-content: flex-start;
  }
`;

const ModalContent = styled.div`
  display: grid;
  gap: var(--ds-space-4);
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;

  .ant-form {
    min-width: 0;
  }

  .ant-form-item,
  .ant-form-item-control,
  .ant-form-item-control-input,
  .ant-form-item-control-input-content,
  .ant-alert,
  .ant-alert-content,
  .ant-alert-message {
    min-width: 0;
    max-width: 100%;
  }

  .ant-alert-message {
    overflow-wrap: anywhere;
    white-space: normal;
  }
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const ProviderPanel = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const ElectronicActivationRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-3);
  align-items: center;
  min-width: 0;
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ElectronicActivationCopy = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const ElectronicSwitch = styled(VmSwitch)`
  justify-self: end;

  @media (max-width: 480px) {
    justify-self: start;
  }
`;

const ProviderItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
`;

const ReadOnlyLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-secondary);
`;

const ReadOnlyValue = styled.span`
  min-width: 0;
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
  overflow-wrap: anywhere;
`;

const Actions = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  justify-content: flex-end;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 560px) {
    button {
      width: 100%;
    }
  }
`;
