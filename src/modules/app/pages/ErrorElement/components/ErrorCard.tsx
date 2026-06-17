import React from 'react';
import styled from 'styled-components';

import { VmCard } from '@/components/heroui';

interface ErrorCardProps {
  children: React.ReactNode;
}

export const ErrorCard = ({ children }: ErrorCardProps) => {
  return (
    <StyledCard variant="transparent">
      <VmCard.Content>{children}</VmCard.Content>
    </StyledCard>
  );
};

const StyledCard = styled(VmCard)`
  width: 100%;
  max-width: 560px;
  border: 0;
  background: transparent;
  box-shadow: none;

  .card__content {
    padding: 0;
  }
`;
