import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import FiscalReceiptsNotificationWidget from './FiscalReceiptsNotificationWidget';
import AccountsReceivableWidget from './AccountsReceivableWidget/AccountsReceivableWidget';
import AuthorizationsWidget from './AuthorizationsWidget';

/**
 * Componente que muestra todos los widgets de notificaciones
 * Recibe los datos de las notificaciones y renderiza cada widget
 */
const NotificationWidgets = ({ data }) => {
  const { fiscalReceipts, inventory, sales, system } = data;

  return (
    <WidgetsContainer
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
          },
        },
      }}
    >
      <WidgetItem
        variants={{
          hidden: { y: 20, opacity: 0 },
          visible: {
            y: 0,
            opacity: 1,
            transition: {
              type: 'tween',
              ease: [0.25, 0.46, 0.45, 0.94],
              duration: 0.4,
            },
          },
        }}
      >
        <AuthorizationsWidget />
      </WidgetItem>

      <WidgetItem
        variants={{
          hidden: { y: 20, opacity: 0 },
          visible: {
            y: 0,
            opacity: 1,
            transition: {
              type: 'tween',
              ease: [0.25, 0.46, 0.45, 0.94],
              duration: 0.4,
            },
          },
        }}
      >
        <FiscalReceiptsNotificationWidget data={fiscalReceipts} />
      </WidgetItem>

      <WidgetItem
        variants={{
          hidden: { y: 20, opacity: 0 },
          visible: {
            y: 0,
            opacity: 1,
            transition: {
              type: 'tween',
              ease: [0.25, 0.46, 0.45, 0.94],
              duration: 0.4,
            },
          },
        }}
      >
        <AccountsReceivableWidget showQuickStats={false} daysThreshold={7} />
      </WidgetItem>
    </WidgetsContainer>
  );
};

const WidgetsContainer = styled(motion.div)`
  padding: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 0em;
`;

const WidgetItem = styled(motion.div)`
  will-change: transform, opacity;
`;

const WidgetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 20px;
  
  /* Media query para pantallas más grandes */
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export default NotificationWidgets;
