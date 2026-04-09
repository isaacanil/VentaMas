import { LazyMotion, domAnimation, m } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

import type { BackOrderItem } from '../types';
const Card = styled(m.div)`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
`;

const StatusBadge = styled.div<{ $status: string }>`
  align-self: center;
  height: fit-content;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ $status }: { $status: string }) =>
    $status === 'pending'
      ? '#d46b08'
      : $status === 'reserved'
        ? '#096dd9'
        : '#595959'};
  text-transform: capitalize;
  background: ${({ $status }: { $status: string }) =>
    $status === 'pending'
      ? '#fff7e6'
      : $status === 'reserved'
        ? '#e6f7ff'
        : '#f5f5f5'};
  border: 1px solid
    ${({ $status }: { $status: string }) =>
      $status === 'pending'
        ? '#ffd591'
        : $status === 'reserved'
          ? '#91d5ff'
          : '#d9d9d9'};
  border-radius: 4px;
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
`;

const Time = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: #595959;
`;

const Quantity = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #262626;
`;

interface BackorderCardProps {
  item: BackOrderItem;
  index: number;
}

const BackorderCard = ({ item, index }: BackorderCardProps) => {
  return (
    <LazyMotion features={domAnimation}>
      <Card
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
      >
        <StatusBadge $status={item.status}>
          {item.status === 'pending'
            ? 'Pendiente'
            : item.status === 'reserved'
              ? 'Reservado'
              : item.status}
        </StatusBadge>

        <InfoContainer>
          <Time>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Time>
          <Quantity>
            {item.pendingQuantity}/{item.initialQuantity} unidades
          </Quantity>
        </InfoContainer>
      </Card>
    </LazyMotion>
  );
};

export default BackorderCard;
