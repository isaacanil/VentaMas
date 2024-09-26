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
  transition: background-color 0.2s, color 0.2s;

  ${(props) => {
    switch (props.variant) {
      case 'ghost':
        return css`
          background: transparent;
          color: #1E3A8A;
          &:hover {
            background-color: rgba(30, 58, 138, 0.1);
          }
        `;
      case 'secondary':
        return css`
          background-color: #6D28D9;
          color: #FFFFFF;
          &:hover {
            background-color: #5B21B6;
          }
        `;
      case 'outline':
        return css`
          background: transparent;
          border: 1px solid #EF4444;
          color: #EF4444;
          &:hover {
            background-color: #EF4444;
            color: #FFFFFF;
          }
        `;
      default:
        return css`
          background-color: #3B82F6;
          color: #FFFFFF;
          &:hover {
            background-color: #2563EB;
          }
        `;
    }
  }}

  ${(props) => {
    switch (props.size) {
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

const Button = ({ variant = 'default', size = 'md', children, onClick, style }) => {
  return (
    <StyledButton variant={variant} size={size} onClick={onClick} style={style}>
      {children}
    </StyledButton>
  );
};

export default Button;
