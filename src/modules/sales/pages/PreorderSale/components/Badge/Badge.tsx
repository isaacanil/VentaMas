import React from 'react';
import styled from 'styled-components';

const StyledBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.25rem;
`;

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

const Badge = ({ children, ...props }: BadgeProps) => {
  return <StyledBadge {...props}>{children}</StyledBadge>;
};

export default Badge;
