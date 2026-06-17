import type { ElementType, ReactNode } from 'react';

export interface TypographyProps {
  variant?: string;
  context?: string;
  color?: string;
  align?: string;
  display?: string;
  gutterBottom?: boolean;
  disableMargins?: boolean;
  noWrap?: boolean;
  component?: ElementType;
  className?: string;
  size?: string;
  italic?: boolean;
  strikethrough?: boolean;
  textShadow?: string;
  children?: ReactNode;
  bold?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  capitalize?: boolean;
  lowercase?: boolean;
  letterSpacing?: string;
  textTransform?: string;
  [key: string]: unknown;
}
