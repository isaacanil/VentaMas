import { CalendarOutlined } from '@ant-design/icons';
import { faBoxes, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../../features/auth/userSlice';
import { useListenBackOrders } from '../../../../../../../../firebase/warehouse/backOrderService';

import BackOrderList from './BackOrderList';

const Container = styled.div`
  display: grid;
  gap: 24px;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Widget = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 0.9rem;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
  
  .icon {
    color: #94a3b8;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 4px;
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
    const user = useSelector(selectUser);
    const { data: backOrders } = useListenBackOrders(user, productId);
    const totalPending = backOrders?.reduce((sum, order) => sum + order.pendingQuantity, 0) || 0;

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
                {/* <Header>
                    <FontAwesomeIcon icon={faBoxes} className="icon" />
                    <span>Resumen de Inventario</span>
                    <div style={{ 
                        marginLeft: 'auto', 
                        fontSize: '0.9rem',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px' 
                    }}>
                        <span>{totalUnits.toLocaleString()}/{(totalUnits + totalPending).toLocaleString()}</span>
                    </div>
                </Header> */}
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