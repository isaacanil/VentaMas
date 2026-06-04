import React from 'react';
import type { ReactNode } from 'react';

import {
  IconWrapper,
  StyledBadge,
  type BadgeSize,
  type BadgeVariant,
} from './Badge.styles';

export interface BadgeProps {
  color?: string;
  bgColor?: string;
  icon?: ReactNode;
  text: string;
  size?: BadgeSize;
  variant?: BadgeVariant;
}

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
