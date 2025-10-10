import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { SelectSettingCart } from '../../../../features/cart/cartSlice';

import BillingModeConfig from './components/BillingModeConfig';
import BillingSection from './components/BillingSection';
import InvoiceSettingsSection from './components/InvoiceSettingsSection';
import QuoteSettingsSection from './components/QuoteSettingsSection';
import StockAlertSettingsSection from './components/StockAlertSettingsSection';

const StyledCard = styled.div`
  margin-top: 16px;
`;

const BillingConfig = () => {
  const { billing: { billingMode,  } } = useSelector(SelectSettingCart);

  return (
    <StyledCard title="Configuración de Ventas y Facturación" bordered={false}>
      <BillingSection
        title="Modo de Facturación"
        description="Seleccione el modo de facturación que desea utilizar."
      >
        <BillingModeConfig billingMode={billingMode} />
      </BillingSection>
      
      <BillingSection
        title="Configuración de Factura"
        description="Configure los detalles de su factura."
      >
        <InvoiceSettingsSection />
      </BillingSection>

      <BillingSection
        title="Configuración de Cotizaciones"
        description="Configure los parámetros predeterminados para sus cotizaciones."
      >
        <QuoteSettingsSection />
      </BillingSection>
      
      {/* Sección temporalmente oculta hasta finalizar configuración */}
      <BillingSection
        title="Reportes de Inventario"
        description="Configura reportes por correo: stock (umbrales bajo/crítico) y vencimientos (días de antelación), frecuencia y hora de envío."
      >
        <StockAlertSettingsSection />
      </BillingSection>
    
    </StyledCard>
  );
};

export default BillingConfig;
