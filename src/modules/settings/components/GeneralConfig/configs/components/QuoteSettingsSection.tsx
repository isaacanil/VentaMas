import { Form, Input, Space, message } from 'antd';
import {
  ClockCircleOutlined,
  EditOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { useEffect } from 'react';
import type { FocusEvent } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';

import {
  Container,
  SettingsGrid,
  StyledCheckbox,
  StyledForm,
  ToggleCard,
  ToggleDescription,
  ToggleIcon,
  ToggleLabelGroup,
  ToggleTitle,
  ValidityInput,
} from './QuoteSettingsSection.styles';

interface QuoteSettingsFormValues {
  quoteEnabled?: boolean;
  quoteDefaultNote?: string;
  quoteValidity?: number;
}

const QuoteSettingsSection = () => {
  const user = useSelector(selectUser);
  const [form] = Form.useForm<QuoteSettingsFormValues>();
  const {
    billing: { quoteEnabled, quoteDefaultNote, quoteValidity },
  } = useSelector(SelectSettingCart);

  useEffect(() => {
    form.setFieldsValue({
      quoteEnabled,
      quoteDefaultNote,
      quoteValidity: quoteValidity || 15,
    });
  }, [quoteEnabled, quoteDefaultNote, quoteValidity, form]);

  const handleQuoteEnabled = (checked: boolean) => {
    void setBillingSettings(user, { quoteEnabled: checked }).then(
      () => {
        message.success(
          checked ? 'Modulo de cotizaciones activado' : 'Modulo desactivado',
        );
      },
      () => {
        message.error('Error al guardar la configuracion');
      },
    );
  };

  const handleValidityBlur = (value: string) => {
    if (!value) return;
    const numValue = Number(value);
    const validValue = numValue > 90 ? 90 : numValue < 1 ? 1 : numValue;
    void setBillingSettings(user, { quoteValidity: validValue }).then(
      () => {
        if (numValue > 90) {
          message.info('Maximo permitido: 90 dias');
          form.setFieldValue('quoteValidity', 90);
        }
      },
      () => {
        message.error('Error al guardar');
      },
    );
  };

  const handleNoteBlur = (event: FocusEvent<HTMLTextAreaElement>) => {
    void setBillingSettings(user, {
      quoteDefaultNote: event.target.value,
    }).then(undefined, () => {
      message.error('Error al guardar');
    });
  };

  const quoteEnabledValue = Form.useWatch('quoteEnabled', form) ?? false;

  return (
    <Container>
      <StyledForm layout="vertical" form={form}>
        <Form.Item name="quoteEnabled" valuePropName="checked" noStyle>
          <ToggleCard
            $active={quoteEnabledValue}
            onClick={() => {
              const newValue = !quoteEnabledValue;
              form.setFieldValue('quoteEnabled', newValue);
              handleQuoteEnabled(newValue);
            }}
          >
            <ToggleLabelGroup>
              <ToggleIcon $active={quoteEnabledValue}>
                <FileDoneOutlined />
              </ToggleIcon>
              <div>
                <ToggleTitle strong>
                  Habilitar cotizaciones comerciales
                </ToggleTitle>
                <ToggleDescription type="secondary">
                  Permite crear presupuestos formales para tus clientes
                </ToggleDescription>
              </div>
            </ToggleLabelGroup>
            <StyledCheckbox checked={quoteEnabledValue} />
          </ToggleCard>
        </Form.Item>

        {quoteEnabledValue && (
          <SettingsGrid>
            <Form.Item
              label={
                <Space>
                  <ClockCircleOutlined />
                  <span>Validez por defecto (dias)</span>
                </Space>
              }
              name="quoteValidity"
              tooltip="Tiempo maximo que la oferta comercial sera valida"
            >
              <ValidityInput
                min={1}
                max={90}
                onBlur={(event) =>
                  handleValidityBlur(event.currentTarget.value)
                }
              />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  <EditOutlined />
                  <span>Nota legal o comercial</span>
                </Space>
              }
              name="quoteDefaultNote"
              tooltip="Este texto se incluira al final de todas tus cotizaciones"
            >
              <Input.TextArea
                rows={4}
                onBlur={handleNoteBlur}
                placeholder="Ej: Esta cotizacion esta sujeta a disponibilidad de inventario..."
              />
            </Form.Item>
          </SettingsGrid>
        )}
      </StyledForm>
    </Container>
  );
};

export default QuoteSettingsSection;
