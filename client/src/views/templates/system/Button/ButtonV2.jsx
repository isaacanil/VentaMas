import React, { useState } from 'react';
import styled, { css  } from 'styled-components';

export const Button = ({
  variant = 'contained', // default, outlined, text, contained
  loading = false,
  loadingIndicator,
  size = 'small', // small, medium, large
  color = 'primary', // primary, secondary, default
  startIcon,
  disabled = false,
  href,
  children,
  onClick,
  borderRadius = ''

}) => {

  return (
    <StyledButton
      variant={variant}
      loading={loading.toString()}
      size={size}
      color={color}
      disabled={disabled}
      href={href}
    
      onClick={onClick}
    >
      {loading ? loadingIndicator || 'Loading...' : startIcon ? <IconContainer>{startIcon}</IconContainer> : null}
      {children}
    </StyledButton>
  );
};


let sizes = {
  small: '14px',
  medium: '16px',
  large: '24px',
  largeIcon: '32px',
  mediumIcon: '24px',
  smallIcon: '16px',
};


const variants = {
  default: css`
    background: none;
    color: ${props => props.theme.colors[props.color].main + 'cc'};
  `,
  outlined: css`
    border: 1px solid${props => props.theme.colors[props.color].main + 'cc'};
    background: none;
    color: ${props => props.theme.colors[props.color].main + 'cc'};
  `,
  text: css`
    border: none;
    background: none;
    color: ${props => props.theme.colors[props.color].main + 'cc'};
  `,
  contained: css`
    background-color: ${props => props.theme.colors[props.color].main + 'cc'};
    color: white;
    border: none;
  `,
  icon: css`
 
    border: none;
   
    color: ${props => props.theme.colors[props.color].main + 'cc'};
    padding: 0;
    min-width: 0;
    font-size: ${props => sizes[props.size] || sizes.large} ;
    width: ${props => sizes[props.size] || sizes.largeIcon};
    height: ${props => sizes[props.size] || sizes.largeIcon};
    min-width: 32px;
    max-width: 32px;
    min-height: 32px;
    max-height: 32px;
    padding: 0;
    margin: 0;
    font-size: 22px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
  `,
};

const StyledButton = styled.button`
  cursor: pointer;
  padding: 0.4em 1em;
  font-size: ${props => sizes[props.size]};
  border-radius: 4px;
  transition: background-color 0.3s ease, transform 0.3s ease;
  ${({ variant }) => variants[variant]};
  ${({ disabled }) =>
    disabled &&
    css`
      cursor: not-allowed;
      opacity: 0.5;
    `}
  &:hover {
    ${({ variant, color, disabled }) =>
    !disabled &&
    variant === 'contained' &&
    css`
        background-color: ${props => props.theme.colors[props.color].main + 'cc'};
        :hover {
          background-color: ${props => props.theme.colors[props.color].dark + 'cc'};
          color: white;
        }
      `}
  }
`;

const IconContainer = styled.span`
  margin-right: 0.5em;
`;

export default Button;
