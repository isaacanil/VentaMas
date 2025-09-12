import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Card = styled(motion.div)`
  padding: 8px 12px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  border-radius: 4px;
  background: white;
  border: 1px solid #f0f0f0;
`;

const StatusBadge = styled.div`
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  height: fit-content;
  align-self: center;
  text-transform: capitalize;
  font-weight: 500;
  background: ${props => props.status === 'pending' ? '#fff7e6' : props.status === 'reserved' ? '#e6f7ff' : '#f5f5f5'};
  color: ${props => props.status === 'pending' ? '#d46b08' : props.status === 'reserved' ? '#096dd9' : '#595959'};
  border: 1px solid ${props => props.status === 'pending' ? '#ffd591' : props.status === 'reserved' ? '#91d5ff' : '#d9d9d9'};
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
`;

const Time = styled.span`
  font-size: 11px;
  color: #595959;
  font-weight: 500;
`;

const Quantity = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #262626;
`;

const BackorderCard = ({ item, index }) => {
  return (
    <Card
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
    >
      <StatusBadge status={item.status}>
        {item.status === 'pending' ? 'Pendiente' : item.status === 'reserved' ? 'Reservado' : item.status}
      </StatusBadge>
      
      <InfoContainer>
        <Time>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Time>
        <Quantity>
          {item.pendingQuantity}/{item.initialQuantity} unidades
        </Quantity>
      </InfoContainer>
    </Card>
  );
};

export default BackorderCard;
