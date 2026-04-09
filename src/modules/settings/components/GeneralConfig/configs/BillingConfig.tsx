import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Button } from 'antd';
import { FileTextOutlined, FileDoneOutlined } from '@ant-design/icons';

import { Modal } from '@/components/common/Modal/Modal';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { getInvoiceTemplateSummaryLabel } from '@/utils/invoice/template';
import SettingCard from './components/SettingCard';
import BillingModeConfig from './components/BillingModeConfig';
import InvoiceSettingsSection from './components/InvoiceSettingsSection';
import QuoteSettingsSection from './components/QuoteSettingsSection';

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

type BillingModalKey = 'invoice' | 'quote' | null;

const BillingConfig = () => {
  const { billing } = useSelector(SelectSettingCart);
  const business = useSelector(selectBusinessData);
  const [activeModal, setActiveModal] = useState<BillingModalKey>(null);

  const closeModal = () => setActiveModal(null);

  // Resumen para Factura
  const invoiceMessage = business?.invoice?.invoiceMessage;
  const invoiceSummary = [
    {
      label: 'Plazo Vencimiento',
      value: billing?.hasDueDate ? 'Habilitado' : 'A la fecha',
    },
    {
      label: 'Nota Legal',
      value: invoiceMessage ? 'Configurada' : 'Por defecto',
    },
    {
      label: 'Plantilla',
      value: getInvoiceTemplateSummaryLabel(billing?.invoiceType),
    },
  ];

  // Resumen para Cotización
  const quoteSummary = [
    {
      label: 'Servicio',
      value: billing?.quoteEnabled !== false ? 'Habilitado' : 'Deshabilitado',
    },
    { label: 'Validez', value: `${billing?.quoteValidity || 15} días` },
  ];

  return (
    <PageWrapper>
      <StyledContainer>
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
        <Modal
          title="Configuración de Factura"
          open={activeModal === 'invoice'}
          onCancel={closeModal}
          centered
          styles={{
            body: {
              padding: 0,
              height:
                'calc(100dvh - var(--modal-viewport-offset) - var(--modal-header-height) - var(--modal-footer-extra-offset))',
              overflow: 'hidden',
            },
          }}
          footer={[]}
          width={1200}
        >
          <InvoiceSettingsSection />
        </Modal>

        {/* Modal Cotización */}
        <Modal
          title="Configuración de Cotización"
          open={activeModal === 'quote'}
          onCancel={closeModal}
          centered
          styles={{
            body: {
              padding: '24px',
            },
          }}
          footer={[
            <Button key="close" type="primary" onClick={closeModal}>
              Listo
            </Button>,
          ]}
          width={720}
        >
          <QuoteSettingsSection />
        </Modal>
      </StyledContainer>
    </PageWrapper>
  );
};

export default BillingConfig;
