// Option.js
import React from 'react';
import styled from 'styled-components';

export const Option = ({ option, closeMenu }) => {
  const handleClick = () => {
    if (option?.action) {
      option.action();
    }
    if (option?.closeWhenAction) {
      closeMenu();
    }
  };

  return (
    <Container onClick={handleClick} isActive={option?.isActive}>
      <Header>
        {option?.icon && (
          <Icon>
            {option?.icon}
          </Icon>
        )}
      </Header>
      <Body>
        <Title>{option?.text}</Title>
      
        {option?.description && (
          <Description>
            {option?.description}
          </Description>
        )}
      </Body>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
 
  align-items: center;
  padding: 0.6em 1em;
  border-bottom: var(--border-primary);
  display: flex;

  :last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f2f2f2;
  }

  ${(props) =>
    props?.isActive &&
    `
      background-color: ${props.theme.colors["primary"]["bg"]};
      color: ${props.theme.colors["primary"]["text"]};
    `}
`;

const Header = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  height: 2em;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0em;
  padding-left: 1em;
`;

const Icon = styled.div`
  width: 2.4em;
  display: grid;
  justify-content: center;
  svg {
    color: #3f3f3f;
    font-size: 1.4em;
  }
`;
const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const Description = styled.div`
  font-size: 13px;
  color: gray;
`;
