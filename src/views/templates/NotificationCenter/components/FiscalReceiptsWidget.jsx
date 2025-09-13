import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faCheckCircle, 
  faReceipt,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useFormatNumber } from '../../../../hooks/useFormatNumber';

const FiscalReceiptsWidget = ({ data }) => {
  const { 
    title, 
    message, 
    percentage, 
    seriesInfo, 
    alertType = 'info',
    hasIssues = false,
    remaining = 0,
    total = 0,
    receipts = [],
    summary = {},
    actionText = 'Ver detalles',
    showQuickStats = false  // Nueva prop para controlar las estadísticas
  } = data;

  // Estados para el scroll horizontal
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const [maxScroll, setMaxScroll] = React.useState(0);
  const containerRef = React.useRef(null);
  const scrollContainerRef = React.useRef(null);

  // Calcular el ancho de cada item
  const itemWidth = 300; // Ancho base + gap
  const visibleItems = Math.floor((containerRef.current?.offsetWidth || 800) / itemWidth);
  const scrollStep = itemWidth;

  React.useEffect(() => {
    const updateMaxScroll = () => {
      if (scrollContainerRef.current && containerRef.current) {
        const totalWidth = receipts.length * itemWidth;
        const containerWidth = containerRef.current.offsetWidth;
        setMaxScroll(Math.max(0, totalWidth - containerWidth));
      }
    };

    updateMaxScroll();
    window.addEventListener('resize', updateMaxScroll);
    return () => window.removeEventListener('resize', updateMaxScroll);
  }, [receipts.length, itemWidth]);

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

  // Determinar el color del borde basado en el tipo de alerta (colores modernos)
  const getAlertColor = () => {
    switch (alertType) {
      case 'error':
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'success':
        return '#10b981';
      default:
        return '#3b82f6';
    }
  };

  // Determinar el icono basado en el tipo de alerta
  const getAlertIcon = () => {
    switch (alertType) {
      case 'error':
      case 'critical':
        return faExclamationTriangle;
      case 'warning':
        return faExclamationTriangle;
      case 'success':
        return faCheckCircle;
      default:
        return faReceipt;
    }
  };

  // Crear título dinámico con resumen
  const getDynamicTitle = () => {
    if (!hasIssues && summary.activeReceipts > 0) {
      return `${title} - ${useFormatNumber(summary.activeReceipts)} Activos`;
    }
    
    if (hasIssues) {
      const critical = summary.criticalReceipts || 0;
      const warning = summary.warningReceipts || 0;
      
      if (critical > 0) {
        return `${title} - ¡${useFormatNumber(critical)} Crítico${critical > 1 ? 's' : ''}!`;
      }
      if (warning > 0) {
        return `${title} - ${useFormatNumber(warning)} Advertencia${warning > 1 ? 's' : ''}`;
      }
    }
    
    return title;
  };

  const handleReceiptClick = (receipt) => {
    console.log('Comprobante seleccionado:', receipt);
    // Aquí podrías navegar a una página de detalles o mostrar más información
  };

  if (!receipts || receipts.length === 0) {
    return (
      <EmptyStateContainer>
        <EmptyStateIcon>
          <FontAwesomeIcon icon={faReceipt} />
        </EmptyStateIcon>
        <EmptyStateTitle>Sin comprobantes configurados</EmptyStateTitle>
        <EmptyStateMessage>
          Configure sus comprobantes fiscales para ver el estado aquí
        </EmptyStateMessage>
      </EmptyStateContainer>
    );
  }

  return (
    <WidgetContainer alertColor={getAlertColor()} hasIssues={hasIssues}>
      {/* Header con información resumida */}
      <WidgetHeader>
        <HeaderInfo>
          <AlertIcon alertColor={getAlertColor()}>
            <FontAwesomeIcon icon={getAlertIcon()} />
          </AlertIcon>
          <HeaderContent>
            <WidgetTitle>{getDynamicTitle()}</WidgetTitle>
            {hasIssues && total > 0 && (
              <ProgressInfo>
                {useFormatNumber(remaining)} de {useFormatNumber(total)} restantes ({percentage}%)
              </ProgressInfo>
            )}
          </HeaderContent>
        </HeaderInfo>
        
        {/* Indicadores rápidos - Opcionales */}
        {showQuickStats && (
          <QuickStats>
            <StatItem>
              <StatValue>{useFormatNumber(summary.activeReceipts || 0)}</StatValue>
              <StatLabel>Activos</StatLabel>
            </StatItem>
            {summary.receiptsNeedingAttention > 0 && (
              <StatItem urgent>
                <StatValue>{useFormatNumber(summary.receiptsNeedingAttention)}</StatValue>
                <StatLabel>Atención</StatLabel>
              </StatItem>
            )}
          </QuickStats>
        )}
      </WidgetHeader>

      {/* Barra de progreso visual si hay problemas */}
      {hasIssues && total > 0 && (
        <ProgressContainer>
          <ProgressBar percentage={percentage} alertColor={getAlertColor()} />
        </ProgressContainer>
      )}

      {/* Lista de comprobantes integrada sin contenedor separado */}
      <ReceiptsContainer>
        {/* Header con navegación solo si hay múltiples elementos */}
        {receipts.length > 3 && (
          <ReceiptsHeader>
            <ItemsCount>
              {useFormatNumber(receipts.length)} comprobantes
            </ItemsCount>
            <NavigationControls>
              <NavButton 
                onClick={scrollLeft} 
                disabled={!canScrollLeft}
                title="Anterior"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </NavButton>
              <NavButton 
                onClick={scrollRight} 
                disabled={!canScrollRight}
                title="Siguiente"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </NavButton>
            </NavigationControls>
          </ReceiptsHeader>
        )}

        <HorizontalScrollContainer ref={containerRef}>
          <HorizontalItemsContainer 
            ref={scrollContainerRef}
            style={{ transform: `translateX(-${scrollPosition}px)` }}
          >
            {receipts.map((receipt, index) => (
              <HorizontalReceiptItem key={`${receipt.series}-${index}`} receipt={receipt} onClick={() => handleReceiptClick && handleReceiptClick(receipt)} />
            ))}
          </HorizontalItemsContainer>
        </HorizontalScrollContainer>
      </ReceiptsContainer>
    </WidgetContainer>
  );
};

// Componente individual para cada comprobante en formato horizontal
const HorizontalReceiptItem = ({ receipt, onClick }) => {
  const getIcon = (alertLevel) => {
    switch (alertLevel) {
      case 'critical':
      case 'warning':
        return faExclamationTriangle;
      default:
        return faCheckCircle;
    }
  };

  const formatRemaining = (remaining) => {
    if (remaining <= 0) return '¡Agotado!';
    if (remaining === 1) return '1 restante';
    return `${useFormatNumber(remaining)} restantes`;
  };

  return (
    <HorizontalReceiptCard
      alertLevel={receipt.alertLevel}
      onClick={onClick}
      clickable={!!onClick}
    >
      <ReceiptCardHeader>
        <ReceiptIconContainer alertLevel={receipt.alertLevel}>
          <FontAwesomeIcon icon={getIcon(receipt.alertLevel)} />
        </ReceiptIconContainer>
        <ReceiptCardTitle>{receipt.name}</ReceiptCardTitle>
      </ReceiptCardHeader>
      
      <ReceiptCardContent>
        <ReceiptSeries>Serie: {receipt.series}</ReceiptSeries>
        <RemainingDisplay alertLevel={receipt.alertLevel}>
          {formatRemaining(receipt.remainingNumbers)}
        </RemainingDisplay>
        
        {receipt.totalNumbers > 0 && (
          <ProgressMiniBar>
            <ProgressMiniFill 
              percentage={receipt.percentageRemaining} 
              alertLevel={receipt.alertLevel}
            />
          </ProgressMiniBar>
        )}
      </ReceiptCardContent>
    </HorizontalReceiptCard>
  );
};

// Estilos modernos y profesionales
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

const WidgetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 20px 24px;
  border-bottom: 1px solid #f3f4f6;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  position: relative;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
`;

const AlertIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: ${props => `${props.alertColor}15`};
  color: ${props => props.alertColor};
  font-size: 16px;
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const WidgetTitle = styled.h3`
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const WidgetMessage = styled.p`
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ProgressInfo = styled.div`
  font-size: 12px;
  color: #374151;
  font-weight: 500;
  margin-top: 4px;
`;

const QuickStats = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-right: 40px; /* Espacio para el badge de estado flotante */
  margin-left: auto; /* Para alinearse a la derecha cuando no hay estadísticas */
`;

const StatItem = styled.div`
  text-align: center;
  padding: 8px 12px;
  border-radius: 6px;
  background: ${props => props.urgent ? '#fef2f2' : '#f8fafc'};
  border: 1px solid ${props => props.urgent ? '#fecaca' : '#e5e7eb'};
  min-width: 50px;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const StatLabel = styled.div`
  font-size: 10px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-top: 2px;
  font-weight: 500;
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

const ReceiptsContainer = styled.div`
  padding: 0 24px 24px 24px;
`;

// Header minimalista para navegación (solo cuando es necesario)
const ReceiptsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em 0 0;
  margin-bottom: 16px;
  min-height: 20px; /* Para mantener espacio consistente */
`;

const ItemsCount = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  align-self: flex-start;
`;

const NavigationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
  color: #6b7280;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #f9fafb;
  }
`;

// Contenedor de scroll integrado
const HorizontalScrollContainer = styled.div`
  overflow: hidden;
  position: relative;
  margin: 0 -8px; /* Compensar padding de las tarjetas */
`;

const HorizontalItemsContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 0 8px; /* Padding para las tarjetas */
  transition: transform 0.3s ease;
  will-change: transform;
`;

const HorizontalReceiptCard = styled.div`
  min-width: 280px;
  max-width: 280px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  /* Badge de estado flotante en la esquina superior derecha */
  &::after {
    content: '';
    position: absolute;
    top: 16px;
    right: 16px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${props => {
      switch (props.alertLevel) {
        case 'critical': return '#ef4444';
        case 'warning': return '#f59e0b';
        default: return '#10b981';
      }
    }};
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 1), 0 2px 4px ${props => {
      switch (props.alertLevel) {
        case 'critical': return '#ef444440';
        case 'warning': return '#f59e0b40';
        default: return '#10b98140';
      }
    }};
  }

  /* Efecto de estado en el icono */
  ${props => props.alertLevel === 'critical' && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
      border-radius: 16px 16px 0 0;
    }
  `}

  ${props => props.alertLevel === 'warning' && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
      border-radius: 16px 16px 0 0;
    }
  `}
`;

const ReceiptCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-right: 28px; /* Espacio para el badge de estado flotante */
`;

const ReceiptIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: ${props => {
    switch (props.alertLevel) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  }};

  svg {
    font-size: 12px;
    color: #ffffff;
  }
`;

const ReceiptCardTitle = styled.h5`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ReceiptCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ReceiptSeries = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
`;

const RemainingDisplay = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${props => {
    switch (props.alertLevel) {
      case 'critical': return '#dc2626';
      case 'warning': return '#d97706';
      default: return '#059669';
    }
  }};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ProgressMiniBar = styled.div`
  height: 4px;
  width: 100%;
  background-color: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
`;

const ProgressMiniFill = styled.div`
  height: 100%;
  width: ${props => props.percentage}%;
  background-color: ${props => {
    switch (props.alertLevel) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  }};
  border-radius: 2px;
  transition: width 0.3s ease;
`;

// Estados vacíos modernos
const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
  margin-bottom: 20px;
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  font-size: 40px;
  color: #d1d5db;
  margin-bottom: 16px;
`;

const EmptyStateTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const EmptyStateMessage = styled.p`
  margin: 0;
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.5;
  max-width: 280px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

export default FiscalReceiptsWidget;
