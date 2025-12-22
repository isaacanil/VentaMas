// src/components/ui/Button.jsx
import React from 'react';
import styled, { css } from 'styled-components';

const StyledButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition:
    background-color 0.2s,
    color 0.2s;

  ${({ $variant }) => {
    switch ($variant) {
      case 'ghost':
        return css`
          color: #1e3a8a;
          background: transparent;

          &:hover {
            background-color: rgb(30 58 138 / 10%);
          }
        `;
      case 'secondary':
        return css`
          color: #fff;
          background-color: #6d28d9;

          &:hover {
            background-color: #5b21b6;
          }
        `;
      case 'outline':
        return css`
          color: #ef4444;
          background: transparent;
          border: 1px solid #ef4444;

          &:hover {
            color: #fff;
            background-color: #ef4444;
          }
        `;
      default:
        return css`
          color: #fff;
          background-color: #3b82f6;

          &:hover {
            background-color: #2563eb;
          }
        `;
    }
  }}

  ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return css`
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        `;
      case 'lg':
        return css`
          padding: 0.75rem 1.5rem;
          font-size: 1.125rem;
        `;
      default:
        return css`
          padding: 0.5rem 1rem;
          font-size: 1rem;
        `;
    }
  }}
`;

const Button = ({
  variant = 'default',
  size = 'md',
  children,
  onClick,
  style,
}) => {
  return (
    <StyledButton $variant={variant} $size={size} onClick={onClick} style={style}>
      {children}
    </StyledButton>
  );
};

export default Button;
