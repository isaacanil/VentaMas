import {
  faExclamationTriangle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

const ReceiptItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 6px;
  cursor: ${(props) => (props.$isClickable ? 'pointer' : 'default')};
  background: ${(props) => {
    switch (props.alertLevel) {
      case 'critical':
        return '#fff2f0';
      case 'warning':
        return '#fffbe6';
      default:
        return '#fafafa';
    }
  }};
  border: 1px solid
    ${(props) => {
      switch (props.alertLevel) {
        case 'critical':
          return '#ff4d4f';
        case 'warning':
          return '#faad14';
        default:
          return '#f0f0f0';
      }
  }};
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
    transform: translateY(-1px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const ReceiptInfo = styled.div`
  flex: 1;
`;

const ReceiptName = styled.div`
  margin-bottom: 2px;
  font-size: 13px;
  font-weight: 500;
  color: #262626;
`;

const ReceiptSeries = styled.div`
  font-size: 11px;
  color: #8c8c8c;
`;

const ReceiptStatus = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
  text-align: right;
`;

const RemainingCount = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => {
    switch (props.alertLevel) {
      case 'critical':
        return '#ff4d4f';
      case 'warning':
        return '#faad14';
      default:
        return '#52c41a';
    }
  }};
`;

const StatusIcon = styled.div`
  display: flex;
  align-items: center;

  svg {
    width: 14px;
    height: 14px;
    color: ${(props) => {
      switch (props.alertLevel) {
        case 'critical':
          return '#ff4d4f';
        case 'warning':
          return '#faad14';
        default:
          return '#52c41a';
      }
    }};
  }
`;

const EmptyState = styled.div`
  padding: 20px;
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
`;

/**
 * Componente para mostrar la lista de comprobantes fiscales
 * @param {Array} receipts - Lista de comprobantes
 * @param {function} onReceiptClick - Callback cuando se hace click en un comprobante
 */
const FiscalReceiptsList = ({ receipts = [], onReceiptClick }) => {
  if (!receipts || receipts.length === 0) {
    return <EmptyState>No hay comprobantes para mostrar</EmptyState>;
  }

  const getIcon = (alertLevel) => {
    switch (alertLevel) {
      case 'critical':
      case 'warning':
        return <FontAwesomeIcon icon={faExclamationTriangle} />;
      default:
        return <FontAwesomeIcon icon={faCheckCircle} />;
    }
  };

  const formatRemaining = (remaining) => {
    if (remaining <= 0) return '¡Agotado!';
    if (remaining === 1) return '1 restante';
    return `${remaining} restantes`;
  };

  return (
    <div>
      {receipts.map((receipt, index) => (
        <ReceiptItem
          key={`${receipt.series}-${index}`}
          alertLevel={receipt.alertLevel}
          $isClickable={Boolean(onReceiptClick)}
          onClick={
            onReceiptClick ? () => onReceiptClick(receipt) : undefined
          }
        >
          <ReceiptInfo>
            <ReceiptName>{receipt.name}</ReceiptName>
            <ReceiptSeries>Serie: {receipt.series}</ReceiptSeries>
          </ReceiptInfo>

          <ReceiptStatus>
            <RemainingCount alertLevel={receipt.alertLevel}>
              {formatRemaining(receipt.remainingNumbers)}
            </RemainingCount>
            <StatusIcon alertLevel={receipt.alertLevel}>
              {getIcon(receipt.alertLevel)}
            </StatusIcon>
          </ReceiptStatus>
        </ReceiptItem>
      ))}
    </div>
  );
};

export default FiscalReceiptsList;
