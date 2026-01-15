import {
  faLockOpen,
  faLock,
  faHourglassHalf,
  faCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { CashCountState } from '@/utils/cashCount/types';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const handleLabelState = (state?: CashCountState | null) => {
  if (!state) return 'Pendiente';
  const stateLabels: Record<string, string> = {
    open: 'Abierto',
    closing: 'Cerrando Cuadre',
    closed: 'Cerrado',
    pending: 'Pendiente',
  };
  return stateLabels[state] || state;
};

interface StatusConfig {
  color: string;
  bgColor: string;
  icon: IconDefinition;
  pulse: boolean;
}

const getStatusConfig = (state?: CashCountState | null): StatusConfig => {
  switch (state) {
    case 'open':
      return {
        color: '#10b981',
        bgColor: '#ecfdf5',
        icon: faLockOpen,
        pulse: false,
      };
    case 'closing':
      return {
        color: '#f59e0b',
        bgColor: '#fffbeb',
        icon: faHourglassHalf,
        pulse: true,
      };
    case 'closed':
      return {
        color: '#6366f1',
        bgColor: '#eef2ff',
        icon: faLock,
        pulse: false,
      };
    default:
      return {
        color: '#94a3b8',
        bgColor: '#f1f5f9',
        icon: faCircle,
        pulse: false,
      };
  }
};

interface CashCountStateIndicatorProps {
  state?: CashCountState | null;
}

export const CashCountStateIndicator: React.FC<CashCountStateIndicatorProps> = ({
  state,
}) => {
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

const Container = styled.div<{ $config: StatusConfig }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 9999px;
  white-space: nowrap;
  width: min-content;
  font-size: 13px;
  font-weight: 600;
  background-color: ${(props: { $config: StatusConfig }) => props.$config.bgColor}cc;
  color: ${(props: { $config: StatusConfig }) => props.$config.color};
  border: 1px solid ${(props: { $config: StatusConfig }) => props.$config.color}30;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
    background-color: ${(props: { $config: StatusConfig }) => props.$config.bgColor};
  }
`;

const IconWrapper = styled.div<{ $pulse: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props: { $pulse: boolean }) =>
    props.$pulse &&
    css`
      animation: ${pulse} 2s infinite ease-in-out;
    `}
`;

const Label = styled.span`
  line-height: 1;
`;
