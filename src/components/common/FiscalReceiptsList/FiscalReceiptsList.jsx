import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

const ReceiptItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 6px;
  border: 1px solid ${props => {
    switch (props.alertLevel) {
      case 'critical': return '#ff4d4f';
      case 'warning': return '#faad14';
      default: return '#f0f0f0';
    }
  }};
  background: ${props => {
    switch (props.alertLevel) {
      case 'critical': return '#fff2f0';
      case 'warning': return '#fffbe6';
      default: return '#fafafa';
    }
  }};
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const ReceiptInfo = styled.div`
  flex: 1;
`;

const ReceiptName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 2px;
`;

const ReceiptSeries = styled.div`
  font-size: 11px;
  color: #8c8c8c;
`;

const ReceiptStatus = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const RemainingCount = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${props => {
    switch (props.alertLevel) {
      case 'critical': return '#ff4d4f';
      case 'warning': return '#faad14';
      default: return '#52c41a';
    }
  }};
`;

const StatusIcon = styled.div`
  display: flex;
  align-items: center;
  
  svg {
    width: 14px;
    height: 14px;
    color: ${props => {
      switch (props.alertLevel) {
        case 'critical': return '#ff4d4f';
        case 'warning': return '#faad14';
        default: return '#52c41a';
      }
    }};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: #8c8c8c;
  font-size: 12px;
`;

/**
 * Componente para mostrar la lista de comprobantes fiscales
 * @param {Array} receipts - Lista de comprobantes
 * @param {function} onReceiptClick - Callback cuando se hace click en un comprobante
 */
const FiscalReceiptsList = ({ receipts = [], onReceiptClick }) => {
  if (!receipts || receipts.length === 0) {
    return (
      <EmptyState>
        No hay comprobantes para mostrar
      </EmptyState>
    );
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
          onClick={() => onReceiptClick && onReceiptClick(receipt)}
          style={{ cursor: onReceiptClick ? 'pointer' : 'default' }}
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
