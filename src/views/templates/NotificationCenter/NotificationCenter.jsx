import { motion } from 'framer-motion';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import {
  selectNotificationCenter,
  closeNotificationCenter,
} from '../../../features/notification/notificationCenterSlice';
import { useFiscalReceiptsAlerts } from '../../../hooks/useFiscalReceiptsAlerts';

import ModulesNavigator from './components/ModulesNavigator';

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
      <Backdrop isOpen={isOpen} onClick={handleClose} />
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
          <ModulesNavigator fiscalReceiptsData={fiscalReceiptsData} />
        </TabsContainer>
      </Container>
    </>
  );
};

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.35);
  z-index: 9950;
  visibility: ${(props) => (props.isOpen ? 'visible' : 'hidden')};
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  transition:
    visibility 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(2px);
  will-change: opacity, visibility;
`;

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #f8fafc84;
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9999;
  overflow: hidden;
  padding: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border-left: 1px solid #e5e7eb;
  will-change: transform, opacity;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(65px);
  padding: 10px 24px;
  border-bottom: 1px solid #e5e7eb;
  background-color: rgba(255, 255, 255, 0);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderText = styled.div``;

const Title = styled.h1`
  font-weight: 700;
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    color: #374151;
    border-color: #d1d5db;
  }
`;

const TabsContainer = styled.div`
  background: transparent;
  border-radius: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
`;

export default NotificationCenter;
