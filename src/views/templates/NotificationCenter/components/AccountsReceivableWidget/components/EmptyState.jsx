import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const EmptyState = ({ daysThreshold }) => {
  return (
    <EmptyStateContainer>
      <EmptyStateIcon>
        <FontAwesomeIcon icon={faCheckCircle} />
      </EmptyStateIcon>
      <EmptyStateTitle>🎉 Todas las cuentas están al día</EmptyStateTitle>
      <EmptyStateMessage>
        No hay cuentas por cobrar próximas a vencer en los próximos {daysThreshold} días
      </EmptyStateMessage>
    </EmptyStateContainer>
  );
};

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  font-size: 40px;
  color: #d1d5db;
  margin-bottom: 16px;
`;

const EmptyStateTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const EmptyStateMessage = styled.p`
  margin: 0;
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

export default EmptyState;
