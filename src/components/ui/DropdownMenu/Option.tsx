// Option.js
import React from 'react';
import styled from 'styled-components';

export const Option = ({ option, closeMenu }) => {
  const handleClick = () => {
    if (option?.disabled) return; // No hacer nada si está deshabilitado

    if (option?.action) {
      option.action();
    }
    if (option?.closeWhenAction) {
      closeMenu();
    }
  };

  return (
    <Container
      onClick={handleClick}
      $isActive={option?.isActive}
      $disabled={option?.disabled}
    >
      <Header>
        {option?.icon && (
          <Icon $disabled={option?.disabled}>{option?.icon}</Icon>
        )}
      </Header>
      <Body>
        <Title $disabled={option?.disabled}>{option?.text}</Title>

        {option?.description && (
          <Description $disabled={option?.disabled}>
            {option?.description}
          </Description>
        )}
      </Body>
    </Container>
  );
};

const Container = styled.div<{ $isActive?: boolean; $disabled?: boolean }>`
  width: 100%;
  align-items: center;
  padding: 0.6em 1em;
  border-bottom: var(--border-primary);
  display: flex;
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${(props) =>
      props.$disabled ? 'transparent' : '#f2f2f2'};
  }

  ${({ $isActive, $disabled, theme }) =>
    $isActive &&
    !$disabled &&
    `
      background-color: ${theme.colors['primary']['bg']};
      color: ${theme.colors['primary']['text']};
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
  gap: 0;
  padding-left: 1em;
`;

const Icon = styled.div<{ $disabled?: boolean }>`
  display: grid;
  justify-content: center;
  width: 2.4em;
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};

  svg {
    font-size: 1.4em;
    color: ${(props) => (props.$disabled ? '#999' : '#3f3f3f')};
  }
`;

const Title = styled.div<{ $disabled?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => (props.$disabled ? '#999' : 'inherit')};
`;

const Description = styled.div<{ $disabled?: boolean }>`
  margin-top: 0.2em;
  font-size: 12px;
  line-height: 1.3;
  color: ${(props) => (props.$disabled ? '#999' : '#5f5f5f')};
`;
