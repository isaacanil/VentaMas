import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faFileInvoice,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import { formatNumber } from '../../../../../../utils/formatNumber';

// Componente individual para cada cuenta en formato horizontal
const HorizontalAccountItem = ({ account, onClick }) => {
  const getIcon = (isOverdue, type) => {
    if (isOverdue) return faExclamationTriangle;
    if (type === 'insurance') return faShieldAlt;
    return faFileInvoice;
  };

  const getAlertLevel = (account) => {
    if (account.isOverdue) return 'critical';
    if (account.daysUntilNextDue <= 3) return 'warning';
    return 'success';
  };

  const formatDueStatus = (account) => {
    if (account.isOverdue) {
      const daysOverdue = Math.abs(account.daysUntilNextDue);
      return {
        text: `Vencido hace ${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'}`,
        color: '#ef4444',
        badge: 'Vencido'
      };
    } else {
      const daysLeft = account.daysUntilNextDue;
      if (daysLeft === 0) {
        return {
          text: 'Vence hoy',
          color: '#f59e0b',
          badge: 'Hoy'
        };
      } else if (daysLeft === 1) {
        return {
          text: 'Vence mañana',
          color: '#f59e0b',
          badge: 'Mañana'
        };
      } else {
        return {
          text: `Vence en ${daysLeft} días`,
          color: '#10b981',
          badge: `${daysLeft}d`
        };
      }
    }
  };

  const formatDate = (date) => {
    return date.toFormat('dd/MM/yyyy');
  };

  const alertLevel = getAlertLevel(account);
  const dueStatus = formatDueStatus(account);

  return (
    <HorizontalAccountCard
      alertLevel={alertLevel}
      onClick={onClick}
      clickable={!!onClick}
    >
      <AccountCardHeader>

        <AccountIconContainer alertLevel={alertLevel}>
          <FontAwesomeIcon icon={getIcon(account.isOverdue, account.type)} />
        </AccountIconContainer>
        <AccountCardTitle>
          {account.clientName}
          {account.type === 'insurance' && (
            <InsuranceBadge>
              <FontAwesomeIcon icon={faShieldAlt} />
              Seguro
            </InsuranceBadge>
          )}
        </AccountCardTitle>
      </AccountCardHeader>
      
      <AccountCardContent>
        <AccountInfo>
          <InfoRow>
            <InfoLabel>
              <FontAwesomeIcon icon={faFileInvoice} />
              Factura:
            </InfoLabel>
            <InfoValue>{account.invoiceNumber || `#${account.invoiceId}`}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Balance:</InfoLabel>
            <InfoValue $highlight>{formatNumber(account.arBalance)}</InfoValue>
          </InfoRow>
         
          {account.totalInstallments >= 1 && (
            <InfoRow>
              <InfoLabel>Cuotas:</InfoLabel>
              <InfoValue>
                <CuotasCounter>
                  <CuotasPagadas>
                    {account.totalInstallments - (account.pendingInstallments || account.installments.filter(i => i.isActive).length)}
                  </CuotasPagadas>
                  <CuotasSeparator>/</CuotasSeparator>
                  <CuotasTotal>{account.totalInstallments}</CuotasTotal>
                </CuotasCounter>
              </InfoValue>
            </InfoRow>
          )}
        </AccountInfo>

        <BottomSection>
          <StatusDisplay alertLevel={alertLevel}>
            {dueStatus.text}
          </StatusDisplay>
          
          {/* Mostrar información de la próxima cuota */}
          {account.installments.filter(i => i.isActive).length > 0 && (
            <NextInstallmentInfo>
              <NextInstallmentLabel>Próxima cuota:</NextInstallmentLabel>
              <NextInstallmentDetails>
                <NextInstallmentAmount>
                  {formatNumber(account.installments.filter(i => i.isActive)[0]?.installmentAmount || 0)}
                </NextInstallmentAmount>
                <NextInstallmentDate>
                  {formatDate(account.installments.filter(i => i.isActive)[0]?.installmentDate)}
                </NextInstallmentDate>
              </NextInstallmentDetails>
            </NextInstallmentInfo>
          )}
        </BottomSection>
      </AccountCardContent>
    </HorizontalAccountCard>
  );
};

const HorizontalAccountCard = styled.div`
  min-width: 280px;
  max-width: 280px;
  background: #ffffff;
  display: grid;
  grid-template-rows: min-content auto;

  border: 2px solid ${props => {
    switch (props.alertLevel) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  }};
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

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: ${props => {
      switch (props.alertLevel) {
        case 'critical': return '#dc2626';
        case 'warning': return '#d97706';
        default: return '#059669';
      }
    }};
  }
`;

const AccountCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding-right: 28px;
  min-height: 25px;
`;

const AccountIconContainer = styled.div`
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

const AccountCardTitle = styled.h5`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  line-height: 1.3;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InsuranceBadge = styled.span`
  background: #3b82f6;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  
  svg {
    font-size: 8px;
  }
`;

const AccountCardContent = styled.div`
  display: grid;
  align-items: start;
  gap: 12px;
`;

const AccountInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  
  svg {
    font-size: 10px;
  }
`;

const InfoValue = styled.span`
  font-size: 12px;
  font-weight: ${props => props.$highlight ? '700' : '600'};
  color: ${props => props.$highlight ? '#1f2937' : '#475569'};
`;

const CuotasCounter = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
`;

const CuotasPagadas = styled.span`
  color: #1f2937;
  font-weight: 700;
`;

const CuotasSeparator = styled.span`
  color: #6b7280;
  font-weight: 400;
`;

const CuotasTotal = styled.span`
  color: #374151;
  font-weight: 600;
`;

const StatusDisplay = styled.div`
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
  padding: 6px 8px;
  background: ${props => {
    switch (props.alertLevel) {
      case 'critical': return '#fef2f2';
      case 'warning': return '#fffbeb';
      default: return '#f0fdf4';
    }
  }};
  border-radius: 6px;
  border: 1px solid ${props => {
    switch (props.alertLevel) {
      case 'critical': return '#fecaca';
      case 'warning': return '#fed7aa';
      default: return '#bbf7d0';
    }
  }};
`;

const NextInstallmentInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bae6fd;
`;

const NextInstallmentLabel = styled.span`
  font-size: 11px;
  color: #0369a1;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const NextInstallmentDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NextInstallmentAmount = styled.span`
  font-size: 13px;
  color: #0c4a6e;
  font-weight: 700;
`;

const NextInstallmentDate = styled.span`
  font-size: 11px;
  color: #0369a1;
  font-weight: 500;
`;

const BottomSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
`;

export default HorizontalAccountItem;
