// @ts-nocheck
import { Form, Input, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { fbUpdateInvoiceMessage } from '@/firebase/businessInfo/fbAddBusinessInfo';
import InvoiceTemplates from '@/modules/invoice/components/Invoice/components/InvoiceTemplates/InvoiceTemplates';

import DueDateConfig from './DueDateConfig';

const ConfigItem = styled.div`
  padding-left: ${({ $level }) => ($level || 0) * 16}px;
  margin-bottom: 8px;
`;

const InvoiceSettingsSection = () => {
  const [form] = Form.useForm();
  const business = useSelector(selectBusinessData);
  const user = useSelector(selectUser);
  const [isSaving, setIsSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const currentMessage = business?.invoice?.invoiceMessage || '';

  useEffect(() => {
    form.setFieldsValue({ invoiceMessage: currentMessage });
  }, [form, currentMessage]);

  const handleInvoiceMessageBlur = async () => {
    const value = form.getFieldValue('invoiceMessage') ?? '';
    const previousValue = business?.invoice?.invoiceMessage || '';

    if (value === previousValue) {
      return;
    }

    if (!user?.businessID) {
      messageApi.error('No se pudo guardar el mensaje.');
      form.setFieldsValue({ invoiceMessage: previousValue });
      return;
    }

    setIsSaving(true);
    try {
      await fbUpdateInvoiceMessage(user, value);
      messageApi.success('Mensaje actualizado');
    } catch {
      messageApi.error('No se pudo guardar el mensaje');
      form.setFieldsValue({ invoiceMessage: previousValue });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form layout="vertical" form={form}>
      {contextHolder}
      <ConfigItem $level={1}>
        <InvoiceTemplates previewInModal />
      </ConfigItem>
      <ConfigItem $level={1}>
        <DueDateConfig />
      </ConfigItem>
      <ConfigItem $level={1}>
        <Form.Item
          name="invoiceMessage"
          label="Mensaje en la factura"
          tooltip="Este mensaje aparecerá en el pie de las facturas y cotizaciones."
        >
          <Input.TextArea
            rows={4}
            maxLength={300}
            onBlur={handleInvoiceMessageBlur}
            disabled={isSaving}
            placeholder="Escribe un mensaje personalizado para la factura, como 'Gracias por su compra'"
          />
        </Form.Item>
      </ConfigItem>
    </Form>
  );
};

export default InvoiceSettingsSection;
