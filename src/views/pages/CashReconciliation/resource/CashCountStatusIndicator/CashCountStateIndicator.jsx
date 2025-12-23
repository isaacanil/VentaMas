import {
  faLockOpen,
  faLock,
  faHourglassHalf,
  faCircle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled, { keyframes, css } from 'styled-components';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const handleLabelState = (state) => {
  if (!state) return 'Pendiente';

  const stateLabels = {
    open: 'Abierto',
    closing: 'Cerrando Cuadre',
    closed: 'Cerrado',
    pending: 'Pendiente',
  };
  return stateLabels[state] || state;
};

const getStatusConfig = (state) => {
  switch (state) {
    case 'open':
      return {
        color: '#10b981', // emerald-500
        bgColor: '#ecfdf5', // emerald-50
        icon: faLockOpen,
        pulse: false
      };
    case 'closing':
      return {
        color: '#f59e0b', // amber-500
        bgColor: '#fffbeb', // amber-50
        icon: faHourglassHalf,
        pulse: true
      };
    case 'closed':
      return {
        color: '#6366f1', // indigo-500
        bgColor: '#eef2ff', // indigo-50
        icon: faLock,
        pulse: false
      };
    default:
      return {
        color: '#94a3b8', // slate-400
        bgColor: '#f1f5f9', // slate-100
        icon: faCircle,
        pulse: false
      };
  }
};

export const CashCountStateIndicator = ({ state }) => {
  const stateLabel = handleLabelState(state);
  const config = getStatusConfig(state);

  return (
    <Container $config={config}>
      <IconWrapper $pulse={config.pulse}>
        <FontAwesomeIcon icon={config.icon} />
      </IconWrapper>
      <Label>{stateLabel}</Label>
    </Container>
  );
};

const Container = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 9999px;
  white-space: nowrap;
  width: min-content;
  font-size: 13px;
  font-weight: 600;
  background-color: ${props => props.$config.bgColor}cc;
  color: ${props => props.$config.color};
  border: 1px solid ${props => props.$config.color}30;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
    background-color: ${props => props.$config.bgColor};
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  ${props => props.$pulse && css`
    animation: ${pulse} 2s infinite ease-in-out;
  `}
`;

const Label = styled.span`
  line-height: 1;
`;
