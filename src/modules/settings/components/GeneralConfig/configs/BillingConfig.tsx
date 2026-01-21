// @ts-nocheck
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Typography, Modal, Button } from 'antd';
import {
  ShoppingOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  SettingOutlined,
  LayoutOutlined
} from '@ant-design/icons';

import { SelectSettingCart } from '@/features/cart/cartSlice';
import { selectBusinessData } from '@/features/auth/businessSlice';
import SettingCard from './components/SettingCard';
import BillingModeConfig from './components/BillingModeConfig';
import InvoiceSettingsSection from './components/InvoiceSettingsSection';
import QuoteSettingsSection from './components/QuoteSettingsSection';

const { Title, Paragraph } = Typography;

const PageWrapper = styled.div`
  min-height: 100%;
  padding: 40px 20px;
  background: #fbfcfd;
  background-image: radial-gradient(#e5e7eb 0.5px, transparent 0.5px);
  background-size: 24px 24px;
`;

const StyledContainer = styled.div`
  max-width: 850px;
  margin-left: auto;
  margin-right: auto;
`;

const PageHeader = styled.div`
  margin-bottom: 48px;
  text-align: left;
  
  .badge {
    display: inline-block;
    padding: 4px 12px;
    background: #e6f7ff;
    color: #1890ff;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
    border: 1px solid #91d5ff;
  }
`;

const CustomModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    overflow: hidden;
  }
  
  .ant-modal-body {
    padding: 0;
    background: #fff;
  }
`;

const BillingConfig = () => {
  const { billing } = useSelector(SelectSettingCart);
  const business = useSelector(selectBusinessData);
  const [activeModal, setActiveModal] = useState(null);

  const closeModal = () => setActiveModal(null);

  // Resumen para Factura
  const invoiceMessage = business?.invoice?.invoiceMessage;
  const invoiceSummary = [
    { label: 'Plazo Vencimiento', value: billing?.hasDueDate ? 'Habilitado' : 'A la fecha' },
    { label: 'Nota Legal', value: invoiceMessage ? 'Configurada' : 'Por defecto' },
    { label: 'Plantilla', value: billing?.invoiceType === 'template2' ? 'Carta' : 'Compacta' },
  ];

  // Resumen para Cotización
  const quoteSummary = [
    { label: 'Servicio', value: billing?.quoteEnabled !== false ? 'Habilitado' : 'Deshabilitado' },
    { label: 'Validez', value: `${billing?.quoteValidity || 15} días` },
  ];

  return (
    <PageWrapper>
      <StyledContainer>
        <PageHeader>
          <div className="badge">Configuración</div>
          <Title level={2} style={{ fontWeight: 800, marginBottom: 8 }}>Gestión de Ventas</Title>
          <Paragraph type="secondary" style={{ fontSize: '16px', maxWidth: '600px' }}>
            Personaliza el flujo de facturación, el diseño de tus comprobantes y el comportamiento del módulo de preventas.
          </Paragraph>
        </PageHeader>

        {/* 1. MODO DE VENTA (VENTA vs PREVENTA) */}
        <BillingModeConfig billingSettings={billing} />

        {/* 2. CONFIGURACIÓN DE FACTURA */}
        <SettingCard
          icon={<FileTextOutlined />}
          title="Formatos y Detalles de Factura"
          description="Establece el diseño visual, mensajes personalizados y términos de pago para tus facturas y proformas."
          summary={invoiceSummary}
          onConfigClick={() => setActiveModal('invoice')}
        />

        {/* 3. COTIZACIONES */}
        <SettingCard
          icon={<FileDoneOutlined />}
          title="Módulo de Cotizaciones"
          description="Configura la validez predeterminada y las notas legales que aparecerán en tus cotizaciones comerciales."
          summary={quoteSummary}
          onConfigClick={() => setActiveModal('quote')}
        />

        {/* Modal Factura */}
        <CustomModal
          title="Configuración de Factura"
          open={activeModal === 'invoice'}
          onCancel={closeModal}
          centered
          footer={[
            <Button key="close" type="primary" onClick={closeModal}>
              Listo
            </Button>
          ]}
          width={1000}
        >
          <InvoiceSettingsSection />
        </CustomModal>

        {/* Modal Cotización */}
        <Modal
          title="Configuración de Cotización"
          open={activeModal === 'quote'}
          onCancel={closeModal}
          centered
          footer={[
            <Button key="close" type="primary" onClick={closeModal}>
              Listo
            </Button>
          ]}
          width={720}
        >
          <div style={{ padding: '24px' }}>
            <QuoteSettingsSection />
          </div>
        </Modal>
      </StyledContainer>
    </PageWrapper>
  );
};

export default BillingConfig;
