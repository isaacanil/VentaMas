import React from 'react';
import styled from 'styled-components';

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  ...props
}) => {
  return (
    <StyledButton
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

const StyledButton = styled.button`
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;

  ${(props) => {
    switch (props.size) {
      case 'small':
        return 'padding: 6px 12px; font-size: 12px;';
      case 'large':
        return 'padding: 12px 24px; font-size: 14px;';
      default:
        return 'padding: 8px 16px; font-size: 13px;';
    }
  }}

  ${(props) => {
    if (props.disabled) {
      return `
                background: #333;
                color: #666;
            `;
    }

    switch (props.variant) {
      case 'secondary':
        return `
                    background: #333;
                    color: #fff;
                    &:hover { background: #444; }
                `;
      case 'danger':
        return `
                    background: #ff4757;
                    color: #fff;
                    &:hover { background: #ff3742; }
                `;
      case 'success':
        return `
                    background: #00ff88;
                    color: #000;
                    &:hover { background: #00e67a; }
                `;
      default:
        return `
                    background: #555;
                    color: #fff;
                    &:hover { background: #666; }
                `;
    }
  }}
`;
