import { Form, Checkbox, InputNumber, Input, message } from 'antd';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../features/auth/userSlice';
import { SelectSettingCart } from '../../../../../features/cart/cartSlice';
import { setBillingSettings } from '../../../../../firebase/billing/billingSetting';

const ConfigItem = styled.div`
  padding-left: ${({ $level }) => ($level || 0) * 16}px;
  margin-bottom: 8px;
`;

const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: min-content min-content;
  gap: 16px;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
`;

const ThresholdInput = styled(InputNumber)`
  width: 140px;

  @media (width <= 768px) {
    width: 100%;
  }
`;

const EmailInput = styled(Input)`
  width: 100%;
  max-width: 480px;
`;

const StockAlertSettingsSection = () => {
  const [form] = Form.useForm();

  const user = useSelector(selectUser);
  const settingsCart = useSelector(SelectSettingCart) || {};
  const { billing = {} } = settingsCart;
  const {
    stockAlertsEnabled,
    stockLowThreshold,
    stockCriticalThreshold,
    stockAlertEmail,
  } = billing;

  useEffect(() => {
    form.setFieldsValue({
      stockAlertsEnabled: !!stockAlertsEnabled,
      stockLowThreshold: Number.isFinite(stockLowThreshold)
        ? stockLowThreshold
        : 20,
      stockCriticalThreshold: Number.isFinite(stockCriticalThreshold)
        ? stockCriticalThreshold
        : 10,
      stockAlertEmail: stockAlertEmail || '',
    });
  }, [
    form,
    stockAlertsEnabled,
    stockLowThreshold,
    stockCriticalThreshold,
    stockAlertEmail,
  ]);

  const saveSetting = async (data) => {
    try {
      await setBillingSettings(user, data);
      message.success('Configuración guardada');
    } catch {
      message.error('No se pudo guardar la configuración');
    }
  };

  const onToggleAlerts = async (checked) => {
    await saveSetting({ stockAlertsEnabled: checked });
  };

  const onBlurThreshold = async (field, rawValue) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
      message.error('Ingrese un número válido');
      return;
    }
    // Ajuste: crítico no puede ser mayor que bajo
    const currentValues = form.getFieldsValue();
    if (
      field === 'stockCriticalThreshold' &&
      value > (currentValues.stockLowThreshold ?? 0)
    ) {
      message.info('El umbral crítico no puede ser mayor que el umbral bajo');
      form.setFieldValue(
        'stockCriticalThreshold',
        Math.max(0, currentValues.stockLowThreshold ?? 0),
      );
      await saveSetting({
        stockCriticalThreshold: Math.max(
          0,
          currentValues.stockLowThreshold ?? 0,
        ),
      });
      return;
    }
    await saveSetting({ [field]: value });
  };

  const onBlurEmail = async (e) => {
    const raw = e?.target?.value || '';
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      await saveSetting({ stockAlertEmail: '' });
      return;
    }

    const invalidFormat = parts.filter(
      (p) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p),
    );
    if (invalidFormat.length > 0) {
      message.error(`Correos inválidos: ${invalidFormat.join(', ')}`);
      return;
    }

    // Validación de dominios permitidos (frontend) usando variable de entorno VITE_STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS
    const allowedDomainsEnv =
      import.meta.env.VITE_STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS || '';
    let allowedDomains = allowedDomainsEnv
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    // Si incluye '*', no restringimos
    const unrestricted = allowedDomains.includes('*');
    if (!unrestricted && allowedDomains.length > 0) {
      const invalidDomainEmails = parts.filter((email) => {
        const domain = email.split('@').pop().toLowerCase();
        return !allowedDomains.includes(domain);
      });
      if (invalidDomainEmails.length > 0) {
        message.error(
          `Dominios no permitidos: ${invalidDomainEmails.join(', ')}`,
        );
        return;
      }
    }

    // Elimina duplicados preservando orden
    const unique = [...new Set(parts)];
    const normalized = unique.join(', ');
    form.setFieldValue('stockAlertEmail', normalized);
    await saveSetting({ stockAlertEmail: normalized });
  };

  const alertsEnabled = Form.useWatch('stockAlertsEnabled', form);

  return (
    <Form layout="vertical" form={form}>
      <ConfigItem $level={0}>
        <Form.Item name="stockAlertsEnabled" valuePropName="checked">
          <Checkbox onChange={(e) => onToggleAlerts(e.target.checked)}>
            Habilitar alertas de stock
          </Checkbox>
        </Form.Item>
      </ConfigItem>

      {alertsEnabled && (
        <>
          {/* Título de sección para agrupar los umbrales y evitar repetir la palabra "Umbral" en cada label */}
          <ConfigItem $level={1} style={{ marginTop: 8 }}>
            <strong>Umbrales</strong>
          </ConfigItem>
          <TwoColumns>
            <ConfigItem $level={1}>
              <Form.Item
                label="Stock bajo"
                name="stockLowThreshold"
                tooltip="Cuando la cantidad sea menor o igual a este valor, se mostrará alerta de stock bajo"
              >
                <ThresholdInput
                  min={0}
                  onBlur={(e) =>
                    onBlurThreshold('stockLowThreshold', e.target.value)
                  }
                />
              </Form.Item>
            </ConfigItem>

            <ConfigItem $level={1}>
              <Form.Item
                label="Stock crítico"
                name="stockCriticalThreshold"
                tooltip="Cuando la cantidad sea menor o igual a este valor, se mostrará alerta crítica"
              >
                <ThresholdInput
                  min={0}
                  onBlur={(e) =>
                    onBlurThreshold('stockCriticalThreshold', e.target.value)
                  }
                />
              </Form.Item>
            </ConfigItem>
          </TwoColumns>

          <ConfigItem $level={1}>
            <Form.Item
              label="Correos de notificación"
              name="stockAlertEmail"
              tooltip="Uno o varios correos separados por coma. Ej: a@dominio.com, b@dominio.com"
            >
              <EmailInput
                placeholder="correo1@dominio.com, correo2@dominio.com"
                onBlur={onBlurEmail}
              />
            </Form.Item>
          </ConfigItem>
          {/* Campo de remitente removido: el remitente se gestiona únicamente en backend */}
        </>
      )}
    </Form>
  );
};

export default StockAlertSettingsSection;
