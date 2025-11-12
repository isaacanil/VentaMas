import React, { ReactNode } from 'react';
import styled, { css } from 'styled-components';

type BadgeSize = 'small' | 'medium' | 'large';
type BadgeVariant = 'filled' | 'outlined' | 'text' | 'light';

interface BadgeProps {
  color?: string;
  bgColor?: string;
  icon?: ReactNode;
  text: string;
  size?: BadgeSize;
  variant?: BadgeVariant;
}

interface StyledBadgeProps {
  $color: string;
  $bgColor: string;
  $size: BadgeSize;
  $variant: BadgeVariant;
}

const getVariantStyles = (props: StyledBadgeProps) => {
  switch (props.$variant) {
    case 'outlined':
      return css`
        background-color: transparent;
        border: 1px solid ${props.$color};
        color: ${props.$color};
      `;
    case 'text':
      return css`
        background-color: transparent;
        color: ${props.$color};
        padding-left: 0;
        padding-right: 0;

        &:hover {
          background-color: transparent;
          transform: none;
        }
      `;
    case 'light':
      return css`
        background-color: ${props.$bgColor}40;
        color: ${props.$color};
      `;
    default: // filled
      return css`
        background-color: ${props.$bgColor};
        color: ${props.$color};
      `;
  }
};

const StyledBadge = styled.div<StyledBadgeProps>`
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;

  ${(props) => {
    switch (props.$size) {
      case 'small':
        return css`
          padding: 2px 8px;
          font-size: 11px;
        `;
      case 'large':
        return css`
          padding: 6px 16px;
          font-size: 15px;
        `;
      default:
        return css`
          padding: 4px 12px;
          font-size: 13px;
        `;
    }
  }}

  ${(props) => getVariantStyles(props)}

    &:hover {
    opacity: 0.8;
    transform: translateY(-1px);
  }
`;

const IconWrapper = styled.span`
  margin-right: 6px;
`;

export function Badge({
  color = '#333',
  bgColor = '#f5f5f5',
  icon,
  text,
  size = 'medium',
  variant = 'filled',
}: BadgeProps) {
  return (
    <StyledBadge
      $color={color}
      $bgColor={bgColor}
      $size={size}
      $variant={variant}
    >
      {icon && <IconWrapper>{icon}</IconWrapper>}
      {text}
    </StyledBadge>
  );
}
