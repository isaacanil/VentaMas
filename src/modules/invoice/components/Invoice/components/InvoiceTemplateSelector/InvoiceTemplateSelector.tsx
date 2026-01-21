import { Select, Form, Button, message, Tooltip } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { EyeOutlined } from '@ant-design/icons';

import { selectUser } from '@/features/auth/userSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';
import type { UserIdentity } from '@/types/users';

const { Option } = Select;

const StyledContainer = styled.div`
  width: 100%;
  
  .ant-form-item {
    margin-bottom: 0;
  }
`;



const PreviewButton = styled(Button)`
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
  }
`;

const invoiceTemplates = [
  {
    id: 'template1',
    name: 'Plantilla Compacta 1',
    description: 'Impresora Térmica 80mm',
  },
  {
    id: 'template4',
    name: 'Plantilla Compacta 2',
    description: 'Impresora Matricial',
  },
  {
    id: 'template2',
    name: 'Plantilla Carta',
    description: 'Impresora Regular / PDF',
  },
];

type InvoiceTemplateKey = 'template1' | 'template2' | 'template4' | string;

interface InvoiceTemplateSelectorProps {
  onSave?: (value: InvoiceTemplateKey) => void;
  onPreview?: () => void;
  template?: InvoiceTemplateKey;
  hidePreviewButton?: boolean;
}

const InvoiceTemplateSelector = ({
  onSave,
  onPreview,
  template,
  hidePreviewButton,
}: InvoiceTemplateSelectorProps) => {
  const user = useSelector(selectUser) as UserIdentity | null;

  const handleTemplateChange = async (value: InvoiceTemplateKey) => {
    try {
      await setBillingSettings(user, { invoiceType: value });
      onSave && onSave(value);
      message.success('Plantilla de factura actualizada');
    } catch {
      message.error('Error al actualizar la plantilla');
    }
  };

  return (
    <StyledContainer>
      <Form.Item label="Seleccionar Plantilla de Factura">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Select
            value={template}
            onChange={handleTemplateChange}
            placeholder="Elegir una plantilla..."
            style={{ width: '100%' }}
            size="large"
          >
            {invoiceTemplates.map((template) => (
              <Option key={template.id} value={template.id}>
                <div>
                  <div style={{ fontWeight: 600 }}>{template.name}</div>
                  <div style={{ fontSize: '13.5px', color: '#5f5f5fff' }}>{template.description}</div>
                </div>
              </Option>
            ))}
          </Select>
          {!hidePreviewButton && (
            <Tooltip title="Ver cómo quedará tu factura">
              <PreviewButton
                type="primary"
                icon={<EyeOutlined />}
                onClick={onPreview}
              >
                Vista Previa
              </PreviewButton>
            </Tooltip>
          )}
        </div>
      </Form.Item>
    </StyledContainer>
  );
};

export default InvoiceTemplateSelector;
