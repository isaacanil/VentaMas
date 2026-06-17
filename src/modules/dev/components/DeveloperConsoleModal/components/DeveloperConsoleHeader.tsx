import React from 'react';
import styled from 'styled-components';

type DeveloperConsoleHeaderProps = {
  title?: React.ReactNode;
};

export const DeveloperConsoleHeader = ({
  title,
}: DeveloperConsoleHeaderProps) => {
  return (
    <HeaderContainer>
      <Title>{title}</Title>
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
