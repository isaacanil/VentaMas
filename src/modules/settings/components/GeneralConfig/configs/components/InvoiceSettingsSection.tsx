// @ts-nocheck
import { Form, Input, message, Typography, Divider } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { fbUpdateInvoiceMessage } from '@/firebase/businessInfo/fbAddBusinessInfo';
import InvoiceTemplates from '@/modules/invoice/components/Invoice/components/InvoiceTemplates/InvoiceTemplates';

import DueDateConfig from './DueDateConfig';

const { Text, Title } = Typography;

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: 480px 1fr;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  min-height: 70vh;
  background: #fff;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const ConfigSidebar = styled.div`
  padding: 10px 12px;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
  max-height: calc(95vh - 160px);
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: #fafafaff;
`;

const PreviewCanvas = styled.div`
  background: #f0f2f5;
  padding: 40px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: calc(95vh - 160px);
  position: relative;
`;


const StyledForm = styled(Form)`
  .ant-form-item-label > label {
    font-weight: 600;
    color: #262626;
    font-size: 14px;
  }

  .ant-input-textarea {
    border-radius: 12px;
    padding: 12px 16px;
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
    border: 1px solid #d9d9d9;
    background: #fdfdfd;
    
    &:hover { border-color: #1890ff; }
    &:focus { 
      border-color: #1890ff; 
      background: #fff;
      box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.1); 
    }
  }
`;

const SectionHeader = styled.div`
  margin-bottom: 24px;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #262626;
  }
  
  p {
    margin: 4px 0 0;
    color: #8c8c8c;
    font-size: 13px;
  }
`;

const SectionWrapper = styled.div`
  padding: 24px;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  background: #fff;
  transition: all 0.3s ease;
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

    if (value === previousValue) return;

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
    <MainLayout>
      {contextHolder}
      <ConfigSidebar>
        <StyledForm layout="vertical" form={form}>
          <SectionWrapper style={{ marginBottom: '24px' }}>
            <SectionHeader>
              <h3>Estilo Visual</h3>
              <p>Selecciona el formato que mejor se adapte a tu impresora.</p>
            </SectionHeader>
            <InvoiceTemplates onlySelector hidePreviewButton />
          </SectionWrapper>

          <SectionWrapper style={{ marginBottom: '24px' }}>
            <SectionHeader>
              <h3>Términos y Plazos</h3>
              <p>Configura las reglas de vencimiento para tus clientes.</p>
            </SectionHeader>
            <DueDateConfig />
          </SectionWrapper>

          <SectionWrapper>
            <SectionHeader>
              <h3>Información Adicional</h3>
              <p>Personaliza el pie de página de tus documentos.</p>
            </SectionHeader>
            <Form.Item
              name="invoiceMessage"
              label="Mensaje en la factura"
              tooltip="Este mensaje aparecerá en el pie de las facturas y cotizaciones."
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea
                rows={4}
                maxLength={300}
                onBlur={handleInvoiceMessageBlur}
                disabled={isSaving}
                placeholder="Ej: 'Gracias por su preferencia y confianza...'"
              />
            </Form.Item>
          </SectionWrapper>
        </StyledForm>
      </ConfigSidebar>

      <PreviewCanvas>
        <InvoiceTemplates
          onlyPreview
        />
      </PreviewCanvas>
    </MainLayout>
  );
};

export default InvoiceSettingsSection;
