import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import FiscalReceiptsNotificationPanel from './FiscalReceiptsNotificationPanel';
import AccountsReceivablePanel from './AccountsReceivablePanel';
import AuthorizationsPanel from './AuthorizationsPanel';

/**
 * Componente que muestra todos los paneles de notificaciones
 * Recibe los datos de las notificaciones y renderiza cada panel
 */
const NotificationPanels = ({ data }) => {
  const { fiscalReceipts, inventory, sales, system } = data;

  return (
    <PanelsContainer
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
      <PanelItem
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
        <AuthorizationsPanel />
      </PanelItem>

      <PanelItem
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
        <FiscalReceiptsNotificationPanel data={fiscalReceipts} />
      </PanelItem>

      <PanelItem
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
        <AccountsReceivablePanel showQuickStats={false} daysThreshold={7} />
      </PanelItem>
    </PanelsContainer>
  );
};

const PanelsContainer = styled(motion.div)`
  padding: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 0em;
`;

const PanelItem = styled(motion.div)`
  will-change: transform, opacity;
`;

export default NotificationPanels;
