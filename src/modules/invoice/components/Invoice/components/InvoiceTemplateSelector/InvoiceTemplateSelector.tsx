import { Select, Form, Button, message } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';
import type { UserIdentity } from '@/types/users';

const { Option } = Select;

const invoiceTemplates = [
  {
    id: 'template1',
    name: 'Plantilla Compacta 1',
    description: 'Diseño compacto ideal para impresoras térmicas',
  },
  {
    id: 'template4',
    name: 'Plantilla Compacta 2',
    description:
      'Diseño compacto ideal para impresoras de impacto (matriciales) de formato reducido',
  },
  {
    id: 'template2',
    name: 'Plantilla Carta',
    description: 'Diseño profesional para formato carta',
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
    <div>
      <Form layout="vertical">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <Form.Item
            label="Seleccionar Plantilla de Factura"
            style={{ flex: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
              <Select
                value={template}
                onChange={handleTemplateChange}
                style={{ width: '100%' }}
              >
                {invoiceTemplates.map((template) => (
                  <Option key={template.id} value={template.id}>
                    {template.name}
                  </Option>
                ))}
              </Select>
              {!hidePreviewButton && (
                <Button size="small" type="primary" onClick={onPreview}>
                  Vista Previa
                </Button>
              )}
            </div>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};

export default InvoiceTemplateSelector;
