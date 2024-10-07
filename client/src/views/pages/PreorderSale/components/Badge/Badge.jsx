// src/components/ui/Badge.jsx
import React from 'react';
import styled from 'styled-components';

const StyledBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
`;

const Badge = ({ children, ...props }) => {
  return <StyledBadge {...props}>{children}</StyledBadge>;
};

export default Badge;
