import React from 'react';
import styled from 'styled-components';

const ReceiptListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ReceiptItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${(props) =>
    props.alertLevel === 'critical'
      ? '#fff2f0'
      : props.alertLevel === 'warning'
        ? '#fffbe6'
        : '#f6ffed'};
  border: 1px solid
    ${(props) =>
      props.alertLevel === 'critical'
        ? '#ffccc7'
        : props.alertLevel === 'warning'
          ? '#ffe58f'
          : '#d9f7be'};
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  }
`;

const ReceiptInfo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
`;

const ReceiptName = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: #262626;
`;

const ReceiptSeries = styled.div`
  font-size: 11px;
  color: #8c8c8c;
`;

const ReceiptStatus = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  color: ${(props) =>
    props.alertLevel === 'critical'
      ? '#cf1322'
      : props.alertLevel === 'warning'
        ? '#d48806'
        : '#389e0d'};
`;

const StatusIcon = styled.i`
  font-size: 10px;
`;

const RemainingCount = styled.div`
  min-width: 40px;
  font-size: 13px;
  font-weight: 600;
  color: ${(props) =>
    props.alertLevel === 'critical'
      ? '#cf1322'
      : props.alertLevel === 'warning'
        ? '#d48806'
        : '#389e0d'};
  text-align: right;
`;

const EmptyState = styled.div`
  padding: 20px;
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
`;

const EmptyIcon = styled.i`
  margin-bottom: 8px;
  font-size: 24px;
  color: #d9d9d9;
`;

/**
 * Componente para mostrar lista de comprobantes fiscales
 */
const FiscalReceiptsList = ({ receipts = [], showAll = false }) => {
  if (!receipts || receipts.length === 0) {
    return (
      <EmptyState>
        <EmptyIcon className="fas fa-file-invoice" />
        <div>No hay comprobantes para mostrar</div>
      </EmptyState>
    );
  }

  const getStatusIcon = (alertLevel) => {
    switch (alertLevel) {
      case 'critical':
        return 'fa-exclamation-triangle';
      case 'warning':
        return 'fa-exclamation-circle';
      default:
        return 'fa-check-circle';
    }
  };

  const getStatusText = (alertLevel, remainingNumbers) => {
    switch (alertLevel) {
      case 'critical':
        return `¡Crítico! ${remainingNumbers} restantes`;
      case 'warning':
        return `Advertencia - ${remainingNumbers} restantes`;
      default:
        return `${remainingNumbers} restantes`;
    }
  };

  const displayReceipts = showAll ? receipts : receipts.slice(0, 3);

  return (
    <ReceiptListContainer>
      {displayReceipts.map((receipt, index) => (
        <ReceiptItem
          key={`${receipt.name}-${receipt.series}-${index}`}
          alertLevel={receipt.alertLevel}
        >
          <ReceiptInfo>
            <ReceiptName>
              <i className="fas fa-file-invoice" />
              {receipt.name}
            </ReceiptName>
            <ReceiptSeries>Serie: {receipt.series}</ReceiptSeries>
            <ReceiptStatus alertLevel={receipt.alertLevel}>
              <StatusIcon
                className={`fas ${getStatusIcon(receipt.alertLevel)}`}
              />
              {getStatusText(receipt.alertLevel, receipt.remainingNumbers)}
            </ReceiptStatus>
          </ReceiptInfo>
          <RemainingCount alertLevel={receipt.alertLevel}>
            {receipt.remainingNumbers}
          </RemainingCount>
        </ReceiptItem>
      ))}

      {!showAll && receipts.length > 3 && (
        <EmptyState>
          <div style={{ color: '#1890ff', fontSize: '11px' }}>
            <i className="fas fa-ellipsis-h" style={{ marginRight: '4px' }} />+
            {receipts.length - 3} comprobantes más
          </div>
        </EmptyState>
      )}
    </ReceiptListContainer>
  );
};

export default FiscalReceiptsList;
