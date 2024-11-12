import React from 'react';
import { Select, Form, Button, message } from 'antd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../features/auth/userSlice';
import { fbUpdateInvoiceType } from '../../../../../firebase/businessInfo/fbAddBusinessInfo';
import { setBillingSettings } from '../../../../../firebase/billing/billingSetting';


const { Option } = Select;

const invoiceTemplates = [
  {
    id: 'template1',
    name: 'Plantilla Térmica',
    description: 'Diseño compacto ideal para impresoras térmicas'
  },
  {
    id: 'template2',
    name: 'Plantilla Carta',
    description: 'Diseño profesional para formato carta'
  },

];

const InvoiceTemplateSelector = ({ onSave, onPreview, template, hidePreviewButton }) => {
  const user = useSelector(selectUser);

  const handleTemplateChange = async (value) => {
    try {
      await setBillingSettings(user, {invoiceType: value});
      onSave && onSave(value);
      message.success('Plantilla de factura actualizada');
    } catch (error) {
      message.error('Error al actualizar la plantilla');
    }
  };

  return (
    <div>
      <Form layout="vertical">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <Form.Item label="Seleccionar Plantilla de Factura" style={{ flex: 1,  }}>
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