import styled, { css } from "styled-components";
import { variants } from "./variants";
import { colors } from "./colors"
import { fontSize } from "./fontSize"
import { getFontSize } from "../../../../../helper/styleHelper";

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
  }
};

const generalSize = {
  small: '0.875rem',
  medium: '1rem',
  large: '1.25rem',
  xlarge: '1.5rem',
  xxlarge: '2rem',
}

const boldScale = {
  small: '500',
  medium: '600',
  large: '700',
  xlarge: '800',
  xxlarge: '900',
  true: 'bold',
  false: 'normal'
}

const baseTypography = css`

  font-size: ${({context, variant, size}) => getFontSize({context, variant, size, variantToSizeMap, generalSize})};

  text-align: ${({ align }) => align ? align : 'left'};
  /* margin-bottom: ${({ gutterBottom }) => (gutterBottom ? '1rem' : '0')}; */
  ${({ disableMargins }) => disableMargins && 'margin: 0;'}
  /* font-weight: ${({ bold }) => boldScale[String(bold)] || 'normal'}; */
  ${({ bold }) => bold && `font-weight: ${boldScale[String(bold)]} ;`}
  ${({ italic }) => italic && 'font-style: italic;'}
  ${({ underline }) => underline && 'text-decoration: underline;'}
  ${({ uppercase }) => uppercase && 'text-transform: uppercase;'}
  ${({ capitalize }) => capitalize && 'text-transform: capitalize;'}
  ${({ lowercase }) => lowercase && 'text-transform: lowercase;'}
  ${({ noWrap }) => noWrap && 'white-space: nowrap;'}
  letter-spacing: ${({ letterSpacing }) => letterSpacing || 'normal'};
  text-transform: ${({ textTransform }) => textTransform || 'none'};
  ${({ display }) => display && `display: ${display};`}
`;
export const TypographyStyle = styled.div`

  ${({ variant }) => variants[variant] || variants.body1}
  ${baseTypography}
  ${({ color }) => colors[color] || colors.dark}
      
  ${({ strikethrough }) => strikethrough && 'text-decoration: line-through;'}
  ${({ textShadow }) => textShadow && `text-shadow: ${textShadow};`}
  ${({ as }) => as === 'a' && `
    cursor: pointer;
    color: #007bff;
    font-weight: 500;
    text-decoration: underline;
    &:hover {
      text-decoration: none;
    }
  `}
`;
export const variantToComponentMap = {
  h1: 'h1',/*Heading */
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  label: 'label',
  l1: 'span',/*label */
  l2: 'span',
  l3: 'span',
  span: 'span',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
};