import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { colors } from './color';
import { variants } from './variants';
import { sizes } from './size';

/**
 * Componente Typography para renderizar texto con estilos personalizados.
 * @param {Object} props - Las propiedades del componente.
 * @param {string} [props.color] - El color del texto.
 * @param {string} [props.size='medium'] - El tamaño del texto.
 * @param {boolean} [props.italic=false] - Indica si el texto debe ser cursivo.
 * @param {boolean} [props.strikethrough=false] - Indica si el texto debe tener una línea en medio.
 * @param {string} [props.textShadow=null] - La propiedad CSS `text-shadow` del elemento de texto.
 * @param {boolean} [props.uppercase=false] - Indica si el texto debe estar en mayúsculas.
 * @param {boolean} [props.capitalize=false] - Indica si el texto debe tener la primera letra de cada palabra en mayúscula.
 * @param {boolean} [props.lowercase=false] - Indica si el texto debe estar en minúsculas.
 * @param {string} [props.letterSpacing='normal'] - La propiedad CSS `letter-spacing` del elemento de texto.
 * @param {string} [props.textTransform='none'] - La propiedad CSS `text-transform` del elemento de texto.
 * @param {boolean} [props.disableMargins=false] - Indica si se deben deshabilitar los márgenes del elemento de texto.
 * @param {boolean} [props.bold=false] - Indica si el texto debe ser negrita.
 * @param {boolean} [props.underline=false] - Indica si el texto debe ser subrayado.  
 * @param {string} [props.variant='body1'] - El estilo de tipografía deseado.
 * 
 * @param {string} [props.align='left'] - La alineación del texto.
 * @param {string} [props.display='initial'] - La propiedad CSS `display` del elemento.
 * @param {boolean} [props.gutterBottom=false] - Indica si se debe agregar un margen inferior al elemento de texto.
 * @param {boolean} [props.noWrap=false] - Indica si el texto debe tener ajuste de línea o no.
 * @param {string|function} [props.component='div'] - El tipo de componente que se debe renderizar.
 * @param {string} [props.className] - Una clase CSS adicional a aplicar al elemento de texto.
 * @param {ReactNode} props.children - El contenido del elemento de texto.
 * @returns {JSX.Element} El componente Typography renderizado.
 */

const { body1, body2, caption, h1, h2, h3, h4, h5, h6, overline, subtitle1, subtitle2 } = sizes

const variantToSizeMap = {
  h1: h1,
  h2: h2,
  h3: h3,
  h4: h4,
  h5: h5,
  h6: h6,
  subtitle1: subtitle1,
  subtitle2: subtitle2,
  body1: body1,
  body2: body2,
  caption: caption,
  overline: overline,
};

const variantToComponentMap = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  span: 'span',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
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
  font-size: ${({ size, variant }) => variant && size ? (variantToSizeMap[variant] ? variantToSizeMap[variant][size] : "defaultSize") : generalSize[size]};
  
  text-align: ${({ align }) => align};
  margin-bottom: ${({ gutterBottom }) => (gutterBottom ? '1rem' : '0')};
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

const TypographyStyle = styled.div`
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

const Typography = ({
  variant = 'body1',
  color = 'dark',
  align = 'left',
  display = 'block',
  gutterBottom = false,
  disableMargins = false,
  noWrap = false,
  component: ComponentProp,
  className,
  size = 'medium', // Nueva propiedad para el tamaño
  italic = false,
  strikethrough = false,
  textShadow = null,
  children,
  bold = false, // Nueva propiedad para el negrita
  underline = false, // Nueva propiedad para el subrayado
  ...rest
}) => {

  const Component = ComponentProp || variantToComponentMap[variant] || 'span';

  return (
    <TypographyStyle
      as={Component}
      variant={variant}
      color={color}
      align={align}
      display={display}
      italic={italic}
      gutterBottom={gutterBottom}
      disableMargins={disableMargins}
      strikethrough={strikethrough}
      textShadow={textShadow}
      size={size}
      noWrap={noWrap}
      underline={underline} // Nueva propiedad para el subrayado
      className={className}
      bold={bold} // Nueva propiedad para el negrita
      {...rest}
    >
      {children}
    </TypographyStyle>
  );
};

Typography.propTypes = {
  children: PropTypes.node.isRequired,
  underline: PropTypes.bool,
  italic: PropTypes.bool,
  strikethrough: PropTypes.bool,
  textShadow: PropTypes.string,
  variant: PropTypes.oneOf(Object.keys(variants)).isRequired,
  color: PropTypes.oneOf(Object.keys(colors)),
  align: PropTypes.oneOf(['left', 'right', 'center', 'justify']),
  display: PropTypes.oneOf(['initial', 'block', 'inline']),
  gutterBottom: PropTypes.bool,
  noWrap: PropTypes.bool,
  disableMargins: PropTypes.bool,
  component: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  className: PropTypes.string,
};

Typography.defaultProps = {
  variant: 'body1',
  color: 'dark',
  align: 'left',
  display: 'block',
  gutterBottom: false,
  disableMargins: false,
  noWrap: false,
  italic: false,
  strikethrough: false,
  textShadow: null,
  bold: false,
  underline: false,
};


export default Typography;
