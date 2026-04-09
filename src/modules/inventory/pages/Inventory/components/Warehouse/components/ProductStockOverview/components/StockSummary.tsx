import { CalendarOutlined } from '@/constants/icons/antd';
import { faBoxes, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback } from 'react';
import styled from 'styled-components';

import BackOrderList from './BackOrderList';
import type { ProductStockItem } from '../types';

const Container = styled.div`
  display: grid;
  gap: 1em;
  align-items: start;

  @media (width <= 768px) {
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
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }
`;

const IconContainer = styled.div<{ $color: string; $background: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 0.9rem;
  color: ${({ $color }) => $color};
  background: ${({ $background }) => $background};
  border-radius: 6px;
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

type StockSummaryProps = {
  filteredStock: ProductStockItem[];
  productId: string;
};

const StockSummary = ({ filteredStock, productId }: StockSummaryProps) => {
  const calculateTotals = useCallback((stocks: ProductStockItem[]) => {
    if (!stocks.length) {
      return { totalUnits: 0, totalLocations: 0, totalBatches: 0 };
    }

    const uniqueLocations = new Set(
      stocks
        .map((stock) => (stock.location ? String(stock.location) : ''))
        .filter(Boolean),
    );
    const totalUnits = stocks.reduce(
      (sum, stock) => sum + Number(stock.quantity ?? 0),
      0,
    );
    const totalBatches = new Set(
      stocks
        .filter((stock) => stock.batchId != null)
        .map((stock) => String(stock.batchId)),
    ).size;

    return {
      totalUnits,
      totalLocations: uniqueLocations.size,
      totalBatches,
    };
  }, []);

  const { totalUnits, totalLocations, totalBatches } =
    calculateTotals(filteredStock);

  return (
    <Container>
      {!filteredStock || filteredStock.length === 0 ? null : (
        <Widget>
          <StatsGrid>
            <StatItem>
              <IconContainer
                $background="rgba(59, 130, 246, 0.1)"
                $color="#3b82f6"
              >
                <FontAwesomeIcon icon={faBoxes} />
              </IconContainer>
              <StatInfo>
                <StatValue>{totalUnits.toLocaleString()}</StatValue>
                <StatLabel>Unidades</StatLabel>
              </StatInfo>
            </StatItem>

            <StatItem>
              <IconContainer
                $background="rgba(16, 185, 129, 0.1)"
                $color="#10b981"
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} />
              </IconContainer>
              <StatInfo>
                <StatValue>{totalLocations}</StatValue>
                <StatLabel>Ubicaciones</StatLabel>
              </StatInfo>
            </StatItem>

            <StatItem>
              <IconContainer
                $background="rgba(245, 158, 11, 0.1)"
                $color="#f59e0b"
              >
                <CalendarOutlined />
              </IconContainer>
              <StatInfo>
                <StatValue>{totalBatches}</StatValue>
                <StatLabel>Lotes</StatLabel>
              </StatInfo>
            </StatItem>
          </StatsGrid>
        </Widget>
      )}

      <BackOrderList productId={productId} />
    </Container>
  );
};

export default StockSummary;
