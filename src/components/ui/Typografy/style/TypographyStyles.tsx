import styled, { css } from 'styled-components';

import { getFontSize } from '@/helper/styleHelper';

import { colors } from './colors';
import { fontSize } from './fontSize';
import { variants } from './variants';

type VariantKey = keyof typeof variants;
type ColorKey = keyof typeof colors;

export interface TypographyStyleProps {
  $context?: 'app' | 'web';
  $variant?: VariantKey;
  $size?: keyof typeof generalSize;
  $align?: string;
  $gutterBottom?: boolean;
  $disableMargins?: boolean;
  $bold?: boolean | string;
  $italic?: boolean;
  $underline?: boolean;
  $uppercase?: boolean;
  $capitalize?: boolean;
  $lowercase?: boolean;
  $noWrap?: boolean;
  $letterSpacing?: string;
  $textTransform?: string;
  $display?: string;
  $color?: ColorKey;
  $strikethrough?: boolean;
  $textShadow?: string;
  as?: any;
}

const variantToSizeMap = {
  app: {
    h1: fontSize.app.h1,
    h2: fontSize.app.h2,
    h3: fontSize.app.h3,
    h4: fontSize.app.h4,
    h5: fontSize.app.h5,
    h6: fontSize.app.h6,
    l1: fontSize.app.l1,
    l2: fontSize.app.l2,
    l3: fontSize.app.l3,
    subtitle1: fontSize.app.subtitle1,
    subtitle2: fontSize.app.subtitle2,
    body1: fontSize.app.body1,
    body2: fontSize.app.body2,
    caption: fontSize.app.caption,
    overline: fontSize.app.overline,
  },
  web: {
    h1: fontSize.web.h1,
    h2: fontSize.web.h2,
    h3: fontSize.web.h3,
    h4: fontSize.web.h4,
    h5: fontSize.web.h5,
    h6: fontSize.web.h6,
    l1: fontSize.web.l1,
    l2: fontSize.web.l2,
    l3: fontSize.web.l3,
    subtitle1: fontSize.web.subtitle1,
    subtitle2: fontSize.web.subtitle2,
    body1: fontSize.web.body1,
    body2: fontSize.web.body2,
    caption: fontSize.web.caption,
    overline: fontSize.web.overline,
  },
};

const generalSize = {
  small: '0.875rem',
  medium: '1rem',
  large: '1.25rem',
  xlarge: '1.5rem',
  xxlarge: '2rem',
};

const boldScale: Record<string, string> = {
  small: '500',
  medium: '600',
  large: '700',
  xlarge: '800',
  xxlarge: '900',
  true: 'bold',
  false: 'normal',
};

const baseTypography = css<TypographyStyleProps>`
  font-size: ${({ $context, $variant, $size }: TypographyStyleProps) =>
    getFontSize({
      context: $context ?? 'app',
      variant: $variant ?? 'body1',
      size: $size ?? 'medium',
      variantToSizeMap,
      generalSize,
    })};
  text-align: ${({ $align }: TypographyStyleProps) => ($align ? $align : 'left')};

  /* margin-bottom: ${({ $gutterBottom }: TypographyStyleProps) => ($gutterBottom ? '1rem' : '0')}; */
  ${({ $disableMargins }: TypographyStyleProps) => $disableMargins && 'margin: 0;'}

  /* font-weight: ${({ $bold }: TypographyStyleProps) => boldScale[String($bold)] || 'normal'}; */
  ${({ $bold }: TypographyStyleProps) => $bold && `font-weight: ${boldScale[String($bold)]} ;`}
  ${({ $italic }: TypographyStyleProps) => $italic && 'font-style: italic;'}
  ${({ $underline }: TypographyStyleProps) => $underline && 'text-decoration: underline;'}
  ${({ $uppercase }: TypographyStyleProps) => $uppercase && 'text-transform: uppercase;'}
  ${({ $capitalize }: TypographyStyleProps) => $capitalize && 'text-transform: capitalize;'}
  ${({ $lowercase }: TypographyStyleProps) => $lowercase && 'text-transform: lowercase;'}
  ${({ $noWrap }: TypographyStyleProps) => $noWrap && 'white-space: nowrap;'}

  letter-spacing: ${({ $letterSpacing }: TypographyStyleProps) => $letterSpacing || 'normal'};
  text-transform: ${({ $textTransform }: TypographyStyleProps) => $textTransform || 'none'};
  ${({ $display }: TypographyStyleProps) => $display && `display: ${$display};`}
`;
export const TypographyStyle = styled.div<TypographyStyleProps>`
  ${({ $variant }: TypographyStyleProps) =>
    variants[$variant ?? 'body1'] || variants.body1}
  ${baseTypography}
  ${({ $color }: TypographyStyleProps) => colors[$color ?? 'dark'] || colors.dark}
      
  ${({ $strikethrough }: TypographyStyleProps) =>
    $strikethrough && 'text-decoration: line-through;'}
  ${({ $textShadow }: TypographyStyleProps) => $textShadow && `text-shadow: ${$textShadow};`}
  ${({ as }: TypographyStyleProps) =>
    as === 'a' &&
    `
    cursor: pointer;
    color: #007bff;
    font-weight: 500;
    text-decoration: underline;
    &:hover {
      text-decoration: none;
    }
  `}
`;
