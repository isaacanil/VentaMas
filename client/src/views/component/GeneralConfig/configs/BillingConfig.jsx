import React from 'react';
import styled from 'styled-components';
import { Divider } from 'antd';
import { useSelector } from 'react-redux';
import { SelectSettingCart } from '../../../../features/cart/cartSlice';
import BillingSection from './components/BillingSection';
import BillingModeConfig from './components/BillingModeConfig';
import InvoiceSettingsSection from './components/InvoiceSettingsSection';

const StyledCard = styled.div`
  margin-top: 16px;
`;

const BillingConfig = () => {
  const { billing: { billingMode } } = useSelector(SelectSettingCart);

  return (
    <StyledCard title="Configuración de Ventas y Facturación" bordered={false}>
      <BillingSection
        title="Modo de Facturación"
        description="Seleccione el modo de facturación que desea utilizar."
      >
        <BillingModeConfig billingMode={billingMode} />
      </BillingSection>
      
      <Divider />
      
      <BillingSection
        title="Configuración de Factura"
        description="Configure los detalles de su factura."
      >
        <InvoiceSettingsSection />
      </BillingSection>
    </StyledCard>
  );
};

export default BillingConfig;
