import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

interface ErrorCardProps {
  children: React.ReactNode;
}

export const ErrorCard = ({ children }: ErrorCardProps) => {
  return <StyledCard>{children}</StyledCard>;
};

ErrorCard.propTypes = {
  children: PropTypes.node.isRequired,
};

const StyledCard = styled.div`
  width: 100%;
  max-width: 600px;
  height: 100%;
  max-height: none;
  padding: 2rem;
  border-radius: 8px;
`;
