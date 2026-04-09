import {
  Form,
  Input,
  InputNumber,
  Checkbox,
  message,
  Typography,
  Space,
} from 'antd';
import { useEffect } from 'react';
import type { FocusEvent } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  FileDoneOutlined,
  ClockCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';

import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';

const { Text } = Typography;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const StyledForm = styled(Form)`
  .ant-form-item-label > label {
    font-weight: 600;
    color: #262626;
  }

  .ant-input-number,
  .ant-input-textarea {
    border-radius: 12px;
    padding: 8px 12px;
    background: #fdfdfd;
    border: 1px solid #d9d9d9;
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

    &:hover {
      border-color: #1890ff;
    }

    &:focus {
      border-color: #1890ff;
      background: #fff;
      box-shadow: 0 0 0 4px rgb(24 144 255 / 10%);
    }
  }
`;

const ToggleCard = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${({ $active }) => ($active ? '#fff' : '#f8f9fa')};
  border-radius: 16px;
  border: 1px solid ${({ $active }) => ($active ? '#1890ff' : '#e9ecef')};
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  cursor: pointer;

  &:hover {
    border-color: #1890ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgb(24 144 255 / 8%);
  }

  .label-group {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: ${({ $active }) => ($active ? '#e6f7ff' : '#ffffff')};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ $active }) => ($active ? '#1890ff' : '#8c8c8c')};
    font-size: 20px;
    border: 1px solid ${({ $active }) => ($active ? '#91d5ff' : '#d9d9d9')};
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 24px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #f0f0f0;
  animation: fade-in 0.4s ease-out;

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

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
          checked ? 'Módulo de cotizaciones activado' : 'Módulo desactivado',
        );
      },
      () => {
        message.error('Error al guardar la configuración');
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
          message.info('Máximo permitido: 90 días');
          form.setFieldValue('quoteValidity', 90);
        }
      },
      () => {
        message.error('Error al guardar');
      },
    );
  };

  const handleNoteBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    void setBillingSettings(user, { quoteDefaultNote: e.target.value }).then(
      undefined,
      () => {
        message.error('Error al guardar');
      },
    );
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
            <div className="label-group">
              <div className="icon">
                <FileDoneOutlined />
              </div>
              <div>
                <Text strong style={{ fontSize: '15px' }}>
                  Habilitar cotizaciones comerciales
                </Text>
                <Text
                  type="secondary"
                  style={{ display: 'block', fontSize: '13px' }}
                >
                  Permite crear presupuestos formales para tus clientes
                </Text>
              </div>
            </div>
            <Checkbox
              checked={quoteEnabledValue}
              style={{ transform: 'scale(1.2)' }}
            />
          </ToggleCard>
        </Form.Item>

        {quoteEnabledValue && (
          <SettingsGrid>
            <Form.Item
              label={
                <Space>
                  <ClockCircleOutlined />
                  <span>Validez por defecto (días)</span>
                </Space>
              }
              name="quoteValidity"
              tooltip="Tiempo máximo que la oferta comercial será válida"
            >
              <InputNumber
                min={1}
                max={90}
                style={{ width: '120px' }}
                onBlur={(e) => handleValidityBlur(e.currentTarget.value)}
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
              tooltip="Este texto se incluirá al final de todas tus cotizaciones"
            >
              <Input.TextArea
                rows={4}
                onBlur={handleNoteBlur}
                placeholder="Ej: 'Esta cotización está sujeta a disponibilidad de inventario...'"
              />
            </Form.Item>
          </SettingsGrid>
        )}
      </StyledForm>
    </Container>
  );
};

export default QuoteSettingsSection;
