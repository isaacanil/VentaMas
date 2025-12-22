import { motion } from 'framer-motion';
import React, { lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import {
  selectNotificationCenter,
  closeNotificationCenter,
} from '../../../features/notification/notificationCenterSlice';
import { useFiscalReceiptsAlerts } from '../../../hooks/useFiscalReceiptsAlerts';
import Loader from '../system/loader/Loader';

const ModulesNavigator = lazy(() => import('./components/ModulesNavigator'));

// Animaciones optimizadas para apertura/cierre
const notificationVariants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'tween',
      ease: [0.25, 0.46, 0.45, 0.94], // cubic-bezier optimizado
      duration: 0.3,
    },
  },
  closed: {
    y: '-100%',
    opacity: 0,
    transition: {
      type: 'tween',
      ease: [0.55, 0.06, 0.68, 0.19], // cubic-bezier para salida
      duration: 0.25,
    },
  },
};

const NotificationCenter = () => {
  const { isOpen } = useSelector(selectNotificationCenter);
  const dispatch = useDispatch();

  // Usar el hook personalizado para obtener datos reales de comprobantes fiscales
  const { widgetData: fiscalReceiptsData } = useFiscalReceiptsAlerts();

  const handleClose = () => dispatch(closeNotificationCenter());

  return (
    <>
      <Backdrop $isOpen={isOpen} onClick={handleClose} />
      <Container
        animate={isOpen ? 'open' : 'closed'}
        initial="closed"
        variants={notificationVariants}
      >
        <Header>
          <Left>
            <HeaderText>
              <Title>Centro de Notificaciones</Title>
            </HeaderText>
          </Left>
          <CloseButton onClick={handleClose}>✕</CloseButton>
        </Header>

        <TabsContainer>
          {isOpen && (
            <Suspense fallback={<Loader />}>
              <ModulesNavigator fiscalReceiptsData={fiscalReceiptsData} />
            </Suspense>
          )}
        </TabsContainer>
      </Container>
    </>
  );
};

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9950;
  visibility: ${(props) => (props.$isOpen ? 'visible' : 'hidden')};
  background-color: rgb(0 0 0 / 35%);
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  backdrop-filter: blur(2px);
  transition:
    visibility 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: opacity, visibility;
`;

const Container = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  padding: 0;
  overflow: hidden;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f8fafc84;
  border-left: 1px solid #e5e7eb;
  will-change: transform, opacity;
`;

const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background-color: rgb(255 255 255 / 0%);
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgb(0 0 0 / 4%);
  backdrop-filter: blur(65px);
`;

const Left = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const HeaderText = styled.div``;

const Title = styled.h1`
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 16px;
  color: #6b7280;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: #374151;
    background: #f1f5f9;
    border-color: #d1d5db;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: transparent;
  border-radius: 0;
`;

export default NotificationCenter;
