import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
  faCalendarAlt, 
  faExclamationTriangle, 
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import useDueDatesReceivable from '../../../../../hooks/accountsReceivable/useDueDatesReceivable';
import { formatNumber } from '../../../../../utils/formatNumber';
import WidgetHeader from './components/WidgetHeader';
import EmptyState from './components/EmptyState';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import AccountsList from './components/AccountsList';

/**
 * Widget para mostrar cuentas por cobrar próximas a vencer
 * Siguiendo el patrón de diseño del FiscalReceiptWidget
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.showQuickStats - Si mostrar estadísticas rápidas
 * @param {number} props.daysThreshold - Días de anticipación para alertas (default: 7)
 */
const AccountsReceivableWidget = ({ showQuickStats = false, daysThreshold = 7 }) => {
  const { dueSoonAccounts, overdueAccounts, loading, error, stats } = useDueDatesReceivable(daysThreshold);

  // Estados para el scroll horizontal
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Calcular el ancho de cada item
  const itemWidth = 300; // Ancho base + gap
  const visibleItems = Math.floor((containerRef.current?.offsetWidth || 800) / itemWidth);
  const scrollStep = itemWidth;

  // Combinar cuentas vencidas y próximas a vencer, priorizando vencidas
  const allAccounts = [...overdueAccounts, ...dueSoonAccounts];

  useEffect(() => {
    const updateMaxScroll = () => {
      if (scrollContainerRef.current && containerRef.current) {
        const totalWidth = allAccounts.length * itemWidth;
        const containerWidth = containerRef.current.offsetWidth;
        setMaxScroll(Math.max(0, totalWidth - containerWidth));
      }
    };

    updateMaxScroll();
    window.addEventListener('resize', updateMaxScroll);
    return () => window.removeEventListener('resize', updateMaxScroll);
  }, [allAccounts.length, itemWidth]);

  const scrollLeft = () => {
    const newPosition = Math.max(0, scrollPosition - scrollStep);
    setScrollPosition(newPosition);
  };

  const scrollRight = () => {
    const newPosition = Math.min(maxScroll, scrollPosition + scrollStep);
    setScrollPosition(newPosition);
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < maxScroll;

  // Determinar el color del borde basado en el tipo de alerta
  const getAlertColor = () => {
    if (stats.totalOverdue > 0) {
      return '#ef4444'; // Rojo para vencidas
    } else if (stats.totalDueSoon > 0) {
      return '#f59e0b'; // Amarillo para próximas
    } else {
      return '#10b981'; // Verde para todo bien
    }
  };

  // Determinar el icono basado en el tipo de alerta
  const getAlertIcon = () => {
    if (stats.totalOverdue > 0) {
      return faExclamationTriangle;
    } else if (stats.totalDueSoon > 0) {
      return faCalendarAlt;
    } else {
      return faCheckCircle;
    }
  };

  // Crear título dinámico con resumen
  const getDynamicTitle = () => {
    if (stats.totalOverdue > 0) {
      return `Cuentas por Cobrar - ¡${formatNumber(stats.totalOverdue)} Vencida${stats.totalOverdue > 1 ? 's' : ''}!`;
    }
    
    if (stats.totalDueSoon > 0) {
      return `Cuentas por Cobrar - ${formatNumber(stats.totalDueSoon)} Próxima${stats.totalDueSoon > 1 ? 's' : ''} a Vencer`;
    }
    
    return 'Cuentas por Cobrar - Al Día';
  };

  const handleAccountClick = (account) => {
    console.log('Cuenta seleccionada:', account);
    // Aquí podrías navegar a una página de detalles o mostrar más información
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState />;
  }

  if (allAccounts.length === 0) {
    return (
      <WidgetContainer alertColor="#10b981" hasIssues={false}>
        <WidgetHeader 
          alertColor="#10b981"
          alertIcon={faCheckCircle}
          title="Cuentas por Cobrar"
          hasIssues={false}
          showQuickStats={false}
        />
        <EmptyState daysThreshold={daysThreshold} />
      </WidgetContainer>
    );
  }

  const hasIssues = stats.totalOverdue > 0 || stats.totalDueSoon > 0;
  const percentage = hasIssues ? Math.round((stats.totalOverdue / stats.totalAlerts) * 100) : 0;

  return (
    <WidgetContainer alertColor={getAlertColor()} hasIssues={hasIssues}>
      {/* Header con información resumida */}
      <WidgetHeader 
        alertColor={getAlertColor()}
        alertIcon={getAlertIcon()}
        title={getDynamicTitle()}
        hasIssues={hasIssues}
        stats={stats}
        percentage={percentage}
        showQuickStats={showQuickStats}
      />

      {/* Barra de progreso visual si hay problemas */}
      {hasIssues && (
        <ProgressContainer>
          <ProgressBar percentage={percentage} alertColor={getAlertColor()} />
        </ProgressContainer>
      )}

      {/* Lista de cuentas */}
      <AccountsList 
        allAccounts={allAccounts}
        containerRef={containerRef}
        scrollContainerRef={scrollContainerRef}
        scrollPosition={scrollPosition}
        scrollLeft={scrollLeft}
        scrollRight={scrollRight}
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
        handleAccountClick={handleAccountClick}
      />
    </WidgetContainer>
  );
};

// Estilos para el contenedor principal
const WidgetContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  
  /* Efecto de elevación moderna */
  ${props => props.hasIssues && `
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border-color: #d1d5db;
  `}

  /* Badge de estado flotante en la esquina superior derecha */
  &::after {
    content: '';
    position: absolute;
    top: 20px;
    right: 20px;
    width: ${props => props.hasIssues ? '14px' : '10px'};
    height: ${props => props.hasIssues ? '14px' : '10px'};
    border-radius: 50%;
    background: ${props => props.alertColor};
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 1), 0 2px 8px ${props => props.alertColor}40;
    z-index: 10;
    transition: all 0.3s ease;
    ${props => props.hasIssues && `
      animation: statusPulse 2s infinite;
    `}
  }

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: #d1d5db;
  }

  @keyframes statusPulse {
    0% { 
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 1), 0 2px 8px ${props => props.alertColor}40, 0 0 0 6px ${props => props.alertColor}20; 
    }
    50% { 
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 1), 0 2px 8px ${props => props.alertColor}40, 0 0 0 12px ${props => props.alertColor}10; 
    }
    100% { 
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 1), 0 2px 8px ${props => props.alertColor}40, 0 0 0 6px ${props => props.alertColor}20; 
    }
  }
`;

const ProgressContainer = styled.div`
  padding: 0 24px 20px 24px;
`;

const ProgressBar = styled.div`
  height: 6px;
  width: 100%;
  background-color: #f3f4f6;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.percentage}%;
    background-color: ${props => props.alertColor};
    border-radius: 3px;
    transition: width 0.4s ease;
  }
`;

export default AccountsReceivableWidget;
