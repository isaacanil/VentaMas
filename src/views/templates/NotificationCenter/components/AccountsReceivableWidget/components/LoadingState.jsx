import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

const LoadingState = () => {
  return (
    <WidgetContainer alertColor="#3b82f6" hasIssues={false}>
      <WidgetHeader>
        <HeaderInfo>
          <AlertIcon alertColor="#3b82f6">
            <FontAwesomeIcon icon={faCalendarAlt} />
          </AlertIcon>
          <HeaderContent>
            <WidgetTitle>Cuentas por Cobrar</WidgetTitle>
            <WidgetMessage>Cargando vencimientos...</WidgetMessage>
          </HeaderContent>
        </HeaderInfo>
      </WidgetHeader>
    </WidgetContainer>
  );
};

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

export default LoadingState;
