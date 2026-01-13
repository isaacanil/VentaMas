import React from 'react';
import type { ElementType, ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { designSystemV2 } from '@/theme/designSystemV2';

const { colors: palette } = designSystemV2;

const SIZE_TOKENS = {
  large: {
    fontSize: '1.1rem',
    lineHeight: '1.6rem',
  },
  medium: {
    fontSize: '1rem',
    lineHeight: '1.45rem',
  },
  small: {
    fontSize: '0.9rem',
    lineHeight: '1.3rem',
  },
  xsmall: {
    fontSize: '0.8rem',
    lineHeight: '1.2rem',
  },
};

const WEIGHT_TOKENS = {
  regular: 400,
  medium: 600,
  bold: 700,
};

const COLOR_TOKENS = {
  primary: palette.text.primary,
  secondary: palette.text.secondary,
  muted: palette.text.muted,
  inverse: palette.text.inverse,
  success: palette.states.success,
  danger: palette.states.danger,
  warning: palette.states.warning,
  info: palette.states.info,
};

const ellipsisStyles = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledText = styled.span<{
  $size?: keyof typeof SIZE_TOKENS;
  $weight?: keyof typeof WEIGHT_TOKENS;
  $color?: keyof typeof COLOR_TOKENS;
  $align?: string;
  $uppercase?: boolean;
  $truncate?: boolean;
}>`
  margin: 0;
  font-size: ${(props) => SIZE_TOKENS[props.$size ?? 'medium'].fontSize};
  line-height: ${(props) => SIZE_TOKENS[props.$size ?? 'medium'].lineHeight};
  font-weight: ${(props) => WEIGHT_TOKENS[props.$weight ?? 'regular']};
  color: ${(props) => COLOR_TOKENS[props.$color ?? 'primary'] ?? COLOR_TOKENS.primary};
  text-align: ${(props) => props.$align};
  letter-spacing: 0.01em;

  ${(props) => props.$uppercase && 'text-transform: uppercase;'}
  ${(props) => props.$truncate && ellipsisStyles}
`;

type SimpleTypographyProps = {
  as?: ElementType;
  size?: keyof typeof SIZE_TOKENS;
  weight?: keyof typeof WEIGHT_TOKENS;
  color?: keyof typeof COLOR_TOKENS;
  align?: 'left' | 'center' | 'right' | 'justify';
  uppercase?: boolean;
  truncate?: boolean;
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
};

export const SimpleTypography = ({
  as = 'span',
  size = 'medium',
  weight = 'regular',
  color = 'primary',
  align = 'left',
  uppercase = false,
  truncate = false,
  children,
  ...rest
}: SimpleTypographyProps) => (
  <StyledText
    as={as}
    $size={size}
    $weight={weight}
    $color={color}
    $align={align ?? 'left'}
    $uppercase={uppercase}
    $truncate={truncate}
    {...rest}
  >
    {children}
  </StyledText>
);

SimpleTypography.displayName = 'SimpleTypography';
