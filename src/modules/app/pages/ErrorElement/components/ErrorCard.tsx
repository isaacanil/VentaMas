import { Card } from '@heroui/react';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

interface ErrorCardProps {
  children: React.ReactNode;
}

export const ErrorCard = ({ children }: ErrorCardProps) => {
  return (
    <StyledCard variant="transparent">
      <Card.Content>{children}</Card.Content>
    </StyledCard>
  );
};

ErrorCard.propTypes = {
  children: PropTypes.node.isRequired,
};

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 560px;
  border: 0;
  background: transparent;
  box-shadow: none;

  .card__content {
    padding: 0;
  }
`;
