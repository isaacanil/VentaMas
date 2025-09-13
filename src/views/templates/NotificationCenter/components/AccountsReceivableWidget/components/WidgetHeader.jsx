import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatNumber } from '../../../../../../utils/formatNumber';

const WidgetHeader = ({ 
  alertColor, 
  alertIcon, 
  title, 
  hasIssues, 
  stats, 
  percentage, 
  showQuickStats 
}) => {
  return (
    <Header>
      <HeaderInfo>
        <AlertIcon alertColor={alertColor}>
          <FontAwesomeIcon icon={alertIcon} />
        </AlertIcon>
        <HeaderContent>
          <WidgetTitle>{title}</WidgetTitle>
          {hasIssues && (
            <ProgressInfo>
              {formatNumber(stats.totalOverdue)} vencidas de {formatNumber(stats.totalAlerts)} total ({percentage}%)
            </ProgressInfo>
          )}
        </HeaderContent>
      </HeaderInfo>
      
      {/* Indicadores rápidos - Opcionales */}
      {showQuickStats && (
        <QuickStats>
          <StatItem urgent={stats.totalOverdue > 0}>
            <StatValue>{formatNumber(stats.totalOverdue)}</StatValue>
            <StatLabel>Vencidas</StatLabel>
          </StatItem>
          <StatItem urgent={stats.totalDueSoon > 0}>
            <StatValue>{formatNumber(stats.totalDueSoon)}</StatValue>
            <StatLabel>Próximas</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{formatNumber(stats.totalAmountDueSoon + stats.totalAmountOverdue)}</StatValue>
            <StatLabel>Monto Total</StatLabel>
          </StatItem>
        </QuickStats>
      )}
    </Header>
  );
};

const Header = styled.div`
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
  margin-right: 40px;
  margin-left: auto;
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

export default WidgetHeader;
