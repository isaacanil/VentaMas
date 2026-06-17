import React from 'react';
import styled from 'styled-components';

type HeaderProps = {
  title?: React.ReactNode;
};

export const Header = ({ title }: HeaderProps) => {
  return (
    <HeaderContainer>
      <Title>{title}</Title>
      {<Subtitle></Subtitle>}
      <DevBadge></DevBadge>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #2a2a2a;
  border-bottom: 1px solid #333;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const Subtitle = styled.p`
  margin: 2px 0 0;
  font-size: 13px;
  color: #999;
`;

const DevBadge = styled.div``;
