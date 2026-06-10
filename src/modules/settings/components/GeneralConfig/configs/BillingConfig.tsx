import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from 'antd';
import { FileDoneOutlined } from '@ant-design/icons';

import { Modal } from '@/components/common/Modal/Modal';
import { VmButton, VmModal } from '@/components/heroui';
import { DollarOutlined, FileTextOutlined } from '@/constants/icons/antd';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';

import BillingModeConfig from './components/BillingModeConfig';
import InvoiceSettingsSection from './components/InvoiceSettingsSection';
import QuoteSettingsSection from './components/QuoteSettingsSection';
import ServiceCommissionSettingsSection from './components/ServiceCommissionSettingsSection/ServiceCommissionSettingsSection';
import SettingCard from './components/SettingCard';
import {
  getCommissionsSummary,
  getInvoiceSummary,
  getQuoteSummary,
  INVOICE_MODAL_BODY_STYLES,
  QUOTE_MODAL_BODY_STYLES,
  type BillingModalKey,
} from './BillingConfig.helpers';
import { PageWrapper, StyledContainer } from './BillingConfig.styles';

const BillingConfig = () => {
  const { billing } = useSelector(SelectSettingCart);
  const business = useSelector(selectBusinessData);
  const [activeModal, setActiveModal] = useState<BillingModalKey>(null);

  const closeModal = () => setActiveModal(null);
  const handleCommissionModalOpenChange = (open: boolean) => {
    setActiveModal(open ? 'commissions' : null);
  };

  const invoiceSummary = getInvoiceSummary(billing, business);
  const quoteSummary = getQuoteSummary(billing);
  const commissionsSummary = getCommissionsSummary(billing);

  return (
    <PageWrapper>
      <StyledContainer>
        <BillingModeConfig billingSettings={billing} />

        <SettingCard
          icon={<FileTextOutlined />}
          title="Formatos y Detalles de Factura"
          description="Establece el diseno visual, mensajes personalizados y terminos de pago para tus facturas y proformas."
          summary={invoiceSummary}
          onConfigClick={() => setActiveModal('invoice')}
        />

        <SettingCard
          icon={<FileDoneOutlined />}
          title="Modulo de Cotizaciones"
          description="Configura la validez predeterminada y las notas legales que apareceran en tus cotizaciones comerciales."
          summary={quoteSummary}
          onConfigClick={() => setActiveModal('quote')}
        />

        <div
          id="billing-service-commissions"
          data-config-section="billing-service-commissions"
        >
          <SettingCard
            icon={<DollarOutlined />}
            title="Comisiones de servicios"
            description="Activa el colaborador por línea de servicio y define la tasa predeterminada para reportes internos."
            summary={commissionsSummary}
            onConfigClick={() => setActiveModal('commissions')}
          />
        </div>

        <Modal
          title="Configuracion de Factura"
          open={activeModal === 'invoice'}
          onCancel={closeModal}
          centered
          styles={{ body: INVOICE_MODAL_BODY_STYLES }}
          footer={[]}
          width={1200}
        >
          <InvoiceSettingsSection />
        </Modal>

        <Modal
          title="Configuracion de Cotizacion"
          open={activeModal === 'quote'}
          onCancel={closeModal}
          centered
          styles={{ body: QUOTE_MODAL_BODY_STYLES }}
          footer={[
            <Button key="close" type="primary" onClick={closeModal}>
              Listo
            </Button>,
          ]}
          width={720}
        >
          <QuoteSettingsSection />
        </Modal>

        <VmModal
          title="Configuración de comisiones"
          ariaLabel="Configuración de comisiones"
          isOpen={activeModal === 'commissions'}
          onOpenChange={handleCommissionModalOpenChange}
          size="lg"
          footer={
            <VmButton variant="primary" onPress={closeModal}>
              Listo
            </VmButton>
          }
        >
          <ServiceCommissionSettingsSection />
        </VmModal>
      </StyledContainer>
    </PageWrapper>
  );
};

export default BillingConfig;
