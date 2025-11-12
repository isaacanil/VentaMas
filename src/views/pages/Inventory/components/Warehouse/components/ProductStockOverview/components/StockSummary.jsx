import { CalendarOutlined } from '@ant-design/icons';
import { faBoxes, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import BackOrderList from './BackOrderList';

const Container = styled.div`
  display: grid;
  gap: 1em;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Widget = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: white;
  border-radius: 12px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background: #f8fafc;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }
`;

const IconContainer = styled.div`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: ${props => props.background};
  color: ${props => props.color};
  font-size: 0.9rem;
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const StockSummary = ({ filteredStock, productId }) => {
    const calculateTotals = useCallback((stocks) => {
        if (!stocks.length) return { totalUnits: 0, totalLocations: 0, totalBatches: 0 };
        const uniqueLocations = new Set(stocks.map(stock => stock.location));
        return {
            totalUnits: stocks.reduce((sum, stock) => sum + stock.quantity, 0),
            totalLocations: uniqueLocations.size,
            totalBatches: new Set(stocks.filter(s => s.batchId).map(s => s.batchId)).size
        };
    }, []);

    const { totalUnits, totalLocations, totalBatches } = calculateTotals(filteredStock);

    return (
        <Container>
          {
            (!filteredStock || filteredStock.length === 0) ? null : (

            <Widget>
                <StatsGrid>
                    <StatItem>
                        <IconContainer background="rgba(59, 130, 246, 0.1)" color="#3b82f6">
                            <FontAwesomeIcon icon={faBoxes} />
                        </IconContainer>
                        <StatInfo>
                            <StatValue>{totalUnits.toLocaleString()}</StatValue>
                            <StatLabel>Unidades</StatLabel>
                        </StatInfo>
                    </StatItem>

                    <StatItem>
                        <IconContainer background="rgba(16, 185, 129, 0.1)" color="#10b981">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                        </IconContainer>
                        <StatInfo>
                            <StatValue>{totalLocations}</StatValue>
                            <StatLabel>Ubicaciones</StatLabel>
                        </StatInfo>
                    </StatItem>

                    <StatItem>
                        <IconContainer background="rgba(245, 158, 11, 0.1)" color="#f59e0b">
                            <CalendarOutlined />
                        </IconContainer>
                        <StatInfo>
                            <StatValue>{totalBatches}</StatValue>
                            <StatLabel>Lotes</StatLabel>
                        </StatInfo>
                    </StatItem>
                </StatsGrid>
            </Widget>
            )

          }
          
            <BackOrderList productId={productId} />
        </Container>
    );
};

export default StockSummary;
