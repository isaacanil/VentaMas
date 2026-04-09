import { Select, Form, Button, message } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';
import type { UserIdentity } from '@/types/users';
import type { QuotationTemplateKey } from '@/modules/invoice/components/Quotation/types';

const { Option } = Select;

type InvoiceTemplateOption = {
  id: QuotationTemplateKey;
  name: string;
  description: string;
};

const invoiceTemplates: InvoiceTemplateOption[] = [
  {
    id: 'template1',
    name: 'Plantilla Térmica',
    description: 'Diseño compacto ideal para impresoras térmicas',
  },
  {
    id: 'template2',
    name: 'Plantilla Carta',
    description: 'Diseño profesional para formato carta',
  },
];

type InvoiceTemplateSelectorProps = {
  onSave?: (template: QuotationTemplateKey) => void;
  onPreview?: () => void;
  template?: QuotationTemplateKey;
  hidePreviewButton?: boolean;
};

const InvoiceTemplateSelector = ({
  onSave,
  onPreview,
  template,
  hidePreviewButton,
}: InvoiceTemplateSelectorProps) => {
  const user = useSelector(selectUser) as UserIdentity | null;

  const handleTemplateChange = (value: QuotationTemplateKey) => {
    void setBillingSettings(user, { invoiceType: value }).then(
      () => {
        onSave?.(value);
        message.success('Plantilla de factura actualizada');
      },
      () => {
        message.error('Error al actualizar la plantilla');
      },
    );
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
