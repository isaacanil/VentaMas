import { Checkbox, Form, message } from 'antd';
import { useEffect, useMemo, useRef } from 'react';
import type { FocusEvent } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import type { CartSettings } from '@/features/cart/types';
import { setBillingSettings } from '@/firebase/billing/billingSetting';

import {
  ConfigItem,
  EmailInput,
  SectionLabel,
  ThresholdInput,
  TwoColumns,
} from './StockAlertSettingsSection.styles';

interface StockAlertFormValues {
  stockAlertsEnabled?: boolean;
  stockLowThreshold?: number;
  stockCriticalThreshold?: number;
  stockAlertEmail?: string;
}

type StockThresholdField = 'stockLowThreshold' | 'stockCriticalThreshold';

const STOCK_ALERT_SETTINGS_FIELDS: Array<keyof StockAlertFormValues> = [
  'stockAlertsEnabled',
  'stockLowThreshold',
  'stockCriticalThreshold',
  'stockAlertEmail',
];

const buildStockAlertInitialValues = ({
  stockAlertsEnabled,
  stockLowThreshold,
  stockCriticalThreshold,
  stockAlertEmail,
}: StockAlertFormValues): StockAlertFormValues => ({
  stockAlertsEnabled: !!stockAlertsEnabled,
  stockLowThreshold: Number.isFinite(stockLowThreshold)
    ? stockLowThreshold
    : 20,
  stockCriticalThreshold: Number.isFinite(stockCriticalThreshold)
    ? stockCriticalThreshold
    : 10,
  stockAlertEmail: stockAlertEmail || '',
});

const getStockAlertHydrationPatch = (
  currentValues: StockAlertFormValues,
  previousValues: StockAlertFormValues,
  nextValues: StockAlertFormValues,
): Partial<StockAlertFormValues> =>
  Object.fromEntries(
    STOCK_ALERT_SETTINGS_FIELDS.flatMap((field) => {
      const currentValue = currentValues[field];
      const previousValue = previousValues[field];
      const nextValue = nextValues[field];

      if (
        Object.is(currentValue, previousValue) ||
        Object.is(currentValue, nextValue)
      ) {
        return [[field, nextValue]];
      }

      return [];
    }),
  ) as Partial<StockAlertFormValues>;

const StockAlertSettingsSection = () => {
  const [form] = Form.useForm<StockAlertFormValues>();
  const hydratedStockAlertValuesRef = useRef<StockAlertFormValues | null>(null);

  const user = useSelector(selectUser);
  const settingsCart = (useSelector(SelectSettingCart) || {}) as CartSettings;
  const billing = (settingsCart.billing || {}) as StockAlertFormValues;
  const {
    stockAlertsEnabled,
    stockLowThreshold,
    stockCriticalThreshold,
    stockAlertEmail,
  } = billing;
  const stockAlertInitialValues = useMemo(
    () =>
      buildStockAlertInitialValues({
        stockAlertsEnabled,
        stockLowThreshold,
        stockCriticalThreshold,
        stockAlertEmail,
      }),
    [
      stockAlertsEnabled,
      stockLowThreshold,
      stockCriticalThreshold,
      stockAlertEmail,
    ],
  );

  useEffect(() => {
    const previousValues = hydratedStockAlertValuesRef.current;

    if (!previousValues) {
      form.setFieldsValue(stockAlertInitialValues);
      hydratedStockAlertValuesRef.current = stockAlertInitialValues;
      return;
    }

    const currentValues = form.getFieldsValue(STOCK_ALERT_SETTINGS_FIELDS);
    const hydrationPatch = getStockAlertHydrationPatch(
      currentValues,
      previousValues,
      stockAlertInitialValues,
    );

    if (Object.keys(hydrationPatch).length > 0) {
      form.setFieldsValue(hydrationPatch);
      hydratedStockAlertValuesRef.current = {
        ...previousValues,
        ...hydrationPatch,
      };
    }
  }, [form, stockAlertInitialValues]);

  const saveSetting = async (data: Partial<CartSettings['billing']>) => {
    try {
      await setBillingSettings(user, data);
      message.success('Configuracion guardada');
    } catch {
      message.error('No se pudo guardar la configuracion');
    }
  };

  const onToggleAlerts = async (checked: boolean) => {
    await saveSetting({ stockAlertsEnabled: checked });
  };

  const onBlurThreshold = async (
    field: StockThresholdField,
    rawValue: string | number | null,
  ) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
      message.error('Ingrese un numero valido');
      return;
    }

    const currentValues = form.getFieldsValue();
    if (
      field === 'stockCriticalThreshold' &&
      value > (currentValues.stockLowThreshold ?? 0)
    ) {
      const nextCriticalThreshold = Math.max(
        0,
        currentValues.stockLowThreshold ?? 0,
      );

      message.info('El umbral critico no puede ser mayor que el umbral bajo');
      form.setFieldValue('stockCriticalThreshold', nextCriticalThreshold);
      await saveSetting({
        stockCriticalThreshold: nextCriticalThreshold,
      });
      return;
    }

    await saveSetting({ [field]: value });
  };

  const onBlurEmail = async (event: FocusEvent<HTMLInputElement>) => {
    const raw = event.target.value || '';
    const parts = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      await saveSetting({ stockAlertEmail: '' });
      return;
    }

    const invalidFormat = parts.filter(
      (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    );
    if (invalidFormat.length > 0) {
      message.error(`Correos invalidos: ${invalidFormat.join(', ')}`);
      return;
    }

    const allowedDomainsEnv =
      import.meta.env.VITE_STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS || '';
    const allowedDomains = allowedDomainsEnv
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);

    const unrestricted = allowedDomains.includes('*');
    if (!unrestricted && allowedDomains.length > 0) {
      const invalidDomainEmails = parts.filter((email) => {
        const domain = email.split('@').pop()?.toLowerCase() ?? '';
        return !allowedDomains.includes(domain);
      });

      if (invalidDomainEmails.length > 0) {
        message.error(
          `Dominios no permitidos: ${invalidDomainEmails.join(', ')}`,
        );
        return;
      }
    }

    const normalized = [...new Set(parts)].join(', ');
    form.setFieldValue('stockAlertEmail', normalized);
    await saveSetting({ stockAlertEmail: normalized });
  };

  const alertsEnabled = Form.useWatch('stockAlertsEnabled', form) ?? false;

  return (
    <Form layout="vertical" form={form}>
      <ConfigItem $level={0}>
        <Form.Item name="stockAlertsEnabled" valuePropName="checked">
          <Checkbox onChange={(event) => onToggleAlerts(event.target.checked)}>
            Habilitar alertas de stock
          </Checkbox>
        </Form.Item>
      </ConfigItem>

      {alertsEnabled && (
        <>
          <ConfigItem $level={1} $spaced>
            <SectionLabel>Umbrales</SectionLabel>
          </ConfigItem>
          <TwoColumns>
            <ConfigItem $level={1}>
              <Form.Item
                label="Stock bajo"
                name="stockLowThreshold"
                tooltip="Cuando la cantidad sea menor o igual a este valor, se mostrara alerta de stock bajo"
              >
                <ThresholdInput
                  min={0}
                  onBlur={(event) =>
                    onBlurThreshold('stockLowThreshold', event.target.value)
                  }
                />
              </Form.Item>
            </ConfigItem>

            <ConfigItem $level={1}>
              <Form.Item
                label="Stock critico"
                name="stockCriticalThreshold"
                tooltip="Cuando la cantidad sea menor o igual a este valor, se mostrara alerta critica"
              >
                <ThresholdInput
                  min={0}
                  onBlur={(event) =>
                    onBlurThreshold(
                      'stockCriticalThreshold',
                      event.target.value,
                    )
                  }
                />
              </Form.Item>
            </ConfigItem>
          </TwoColumns>

          <ConfigItem $level={1}>
            <Form.Item
              label="Correos de notificacion"
              name="stockAlertEmail"
              tooltip="Uno o varios correos separados por coma. Ej: a@dominio.com, b@dominio.com"
            >
              <EmailInput
                placeholder="correo1@dominio.com, correo2@dominio.com"
                onBlur={onBlurEmail}
              />
            </Form.Item>
          </ConfigItem>
        </>
      )}
    </Form>
  );
};

export default StockAlertSettingsSection;
