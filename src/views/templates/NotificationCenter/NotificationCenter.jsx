import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import NotificationWidgets from './components/NotificationWidgets';
import { selectNotificationCenter, closeNotificationCenter } from '../../../features/notification/notificationCenterSlice';
import { useFiscalReceiptsAlerts } from '../../../hooks/useFiscalReceiptsAlerts';
import useScrollHeader from '../../../hooks/useScrollHeader';

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
  const [activeTab] = useState('notifications');
  const { isOpen } = useSelector(selectNotificationCenter);
  const dispatch = useDispatch();
  
  // Hook para header dinámico
  const { isScrolled, scrollContainerRef, progress } = useScrollHeader({
    threshold: 60, // Pixel threshold para activar el estado compacto
    debounceDelay: 8 // Delay optimizado para suavidad
  });
  
  // Efecto para hacer scroll al top cuando se abra el notification center
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [isOpen, scrollContainerRef]);
  
  // Usar el hook personalizado para obtener datos reales de comprobantes fiscales
  const { widgetData: fiscalReceiptsData, isLoading: loadingFiscalData } = useFiscalReceiptsAlerts();

  // Datos de ejemplo para otras notificaciones (se pueden reemplazar con datos reales)
  const notificationData = useMemo(() => ({
    fiscalReceipts: fiscalReceiptsData,
    inventory: {
      title: 'Inventario Bajo',
      items: [
        { name: 'Papel Térmico 80mm', status: 'crítico' },
        { name: 'Tinta Epson T664', status: 'crítico' },
        { name: 'Café Premium 1kg', status: 'bajo' },
      ],
    },
    sales: {
      title: 'Meta de Ventas',
      current: 78000,
      goal: 100000,
      percentage: 78,
      daysLeft: 3,
    },
    system: {
      title: 'Actualizaciones del Sistema',
      currentVersion: '2.4.1',
      newVersion: '2.5.0',
      hasUpdate: true,
      improvements: 'Incluye mejoras de seguridad y nuevas funcionalidades.',
    },
  }), [fiscalReceiptsData]);

  const handleClose = () => dispatch(closeNotificationCenter());

  return (
    <>
      <Backdrop isOpen={isOpen} onClick={handleClose} />
      <Container animate={isOpen ? 'open' : 'closed'} initial='closed' variants={notificationVariants}>
        <Header 
          animate={{
            padding: isScrolled ? '8px 24px 8px 24px' : '24px 24px 20px 24px',
            boxShadow: isScrolled 
              ? '0 4px 12px rgba(0, 0, 0, 0.08)' 
              : '0 1px 3px rgba(0, 0, 0, 0.04)',
            backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : '#ffffff',
            backdropFilter: isScrolled ? 'blur(8px)' : 'blur(0px)'
          }}
          transition={{
            type: 'tween',
            ease: [0.25, 0.46, 0.45, 0.94],
            duration: 0.2
          }}
        >
          <Left 
            animate={{
              gap: isScrolled ? '8px' : '12px'
            }}
            transition={{
              type: 'tween',
              ease: [0.25, 0.46, 0.45, 0.94],
              duration: 0.2
            }}
          >
 
            <HeaderText>
              <Title 
                animate={{
                  fontSize: isScrolled ? '18px' : '20px'
                }}
                transition={{
                  type: 'tween',
                  ease: [0.25, 0.46, 0.45, 0.94],
                  duration: 0.2
                }}
              >
                Centro de Notificaciones
              </Title>
            </HeaderText>
          </Left>
          <CloseButton onClick={handleClose}>✕</CloseButton>
        </Header>

        <TabsContainer ref={scrollContainerRef}>
          <NotificationWidgets data={notificationData} />
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
  visibility: ${props => (props.isOpen ? 'visible' : 'hidden')};
  opacity: ${props => (props.isOpen ? 1 : 0)};
  transition: visibility 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
              opacity 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(2px);
  will-change: opacity, visibility;
`;

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #f8fafc84 ;
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9999;
  overflow: hidden;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border-left: 1px solid #e5e7eb;
  will-change: transform, opacity;
`;

const Header = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  background-color: transparent !important;
  position: sticky;
  top: 0;
  z-index: 10;
  will-change: transform, background-color, box-shadow, padding;
`;

const Left = styled(motion.div)`
  display: flex;
  align-items: center;
  will-change: transform;
`;

const Icon = styled(motion.div)`
  will-change: transform;
`;

const HeaderText = styled(motion.div)`
  will-change: transform;
`;

const Title = styled(motion.h1)`
  font-weight: 700;
  margin: 0;
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  will-change: transform;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 2px 0 0 0;
  font-weight: 400;
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
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Estilos personalizados para el scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
    
    &:hover {
      background: #94a3b8;
    }
  }
  
  /* Para Firefox */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
  
  /* Agregar espacio entre widgets */
  & > div > * {
    margin-bottom: 20px;
  }
  
  & > div > *:last-child {
    margin-bottom: 0;
  }
`;

export default NotificationCenter;
