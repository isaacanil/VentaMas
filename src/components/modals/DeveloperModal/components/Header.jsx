import React from 'react';
import styled from 'styled-components';

export const Header = ({ title, subtitle: _subtitle }) => {
  return (
    <HeaderContainer>
      <Title>{title}</Title>
      {<Subtitle></Subtitle>}
      <DevBadge></DevBadge>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  background: #2a2a2a;
  padding: 12px 20px;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #999;
  font-size: 13px;
  margin: 2px 0 0 0;
`;

const DevBadge = styled.div``;
