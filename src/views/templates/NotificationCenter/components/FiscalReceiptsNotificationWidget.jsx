import React, { useState } from 'react';
import { Drawer } from 'antd';
import styled from 'styled-components';
import FiscalReceiptsWidget from './FiscalReceiptsWidget';
import FiscalReceiptsDetailView from '../../../pages/setting/subPage/TaxReceipts/components/FiscalReceiptsAlertWidget/FiscalReceiptsDetailView';
import { useFiscalReceiptsAlerts } from '../../../../hooks/useFiscalReceiptsAlerts';

/**
 * Widget híbrido para NotificationCenter - Versión simplificada
 * Similar al widget de configuración pero enfocado en mostrar alertas
 */
const FiscalReceiptsNotificationWidget = ({ data }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const { 
    widgetData, 
    hasIssues, 
    isLoading, 
    alertSummary,
    criticalReceipts,
    warningReceipts 
  } = useFiscalReceiptsAlerts();

  const handleWidgetClick = () => {
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <>
      <ClickableContainer onClick={handleWidgetClick}>
        <FiscalReceiptsWidget data={data} />
      </ClickableContainer>

      <Drawer
        title="Detalles de Alertas - Comprobantes Fiscales"
        placement="right"
        onClose={handleCloseDrawer}
        open={drawerVisible}
        width={600}
        styles={{
          body: { padding: 0 },
        }}
      >
        <FiscalReceiptsDetailView 
          widgetData={widgetData}
          alertSummary={alertSummary}
          criticalReceipts={criticalReceipts}
          warningReceipts={warningReceipts}
          hasIssues={hasIssues}
          isLoading={isLoading}
        />
      </Drawer>
    </>
  );
};

const ClickableContainer = styled.div`
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default FiscalReceiptsNotificationWidget;
