import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

/**
 * Componente Typography para renderizar texto con estilos personalizados.
 * @param {Object} props - Las propiedades del componente.
 * @param {string} props.variant - El estilo de tipografía deseado.
 * @param {string} [props.color] - El color del texto.
 * @param {string} [props.align='left'] - La alineación del texto.
 * @param {string} [props.display='initial'] - La propiedad CSS `display` del elemento.
 * @param {boolean} [props.gutterBottom=false] - Indica si se debe agregar un margen inferior al elemento de texto.
 * @param {boolean} [props.noWrap=false] - Indica si el texto debe tener ajuste de línea o no.
 * @param {boolean} [props.paragraph=false] - Indica si el texto es parte de un párrafo.
 * @param {string|function} [props.component='div'] - El tipo de componente que se debe renderizar.
 * @param {string} [props.className] - Una clase CSS adicional a aplicar al elemento de texto.
 * @param {ReactNode} props.children - El contenido del elemento de texto.
 * @returns {JSX.Element} El componente Typography renderizado.
 */
const variants = {
  h1: css`
    font-size: 2.125rem;
    margin: 0.5rem 0;
    line-height: 1.2;
    font-weight: 600;
  `,
  h2: css`
    font-size: 1.5rem;
    margin: 0.45rem 0;
    line-height: 1.3;
    font-weight: 500;
  `,
  h3: css`
    font-size: 1.25rem;
    margin: 0.4rem 0;
    line-height: 1.4;
    font-weight: 500;
  `,
  h4: css`
    font-size: 1rem;
    margin: 0.35rem 0;
    line-height: 1.5;
    font-weight: 400;
  `,
  h5: css`
    font-size: 0.875rem;
    margin: 0.3rem 0;
    line-height: 1.6;
    font-weight: 400;
  `,
  h6: css`
    font-size: 0.75rem;
    margin: 0.25rem 0;
    line-height: 1.7;
    font-weight: 400;
  `,
  subtitle1: css`
    font-size: 1rem;
    margin: 0.35rem 0;
    line-height: 1.5;
    font-weight: 400;
  `,
  subtitle2: css`
    font-size: 0.875rem;
    margin: 0.3rem 0;
    line-height: 1.6;
    font-weight: 400;
  `,
  body1: css`
    font-size: 1rem;
    margin: 0.35rem 0;
    line-height: 1.5;
    font-weight: 400;
  `,
  body2: css`
    font-size: 1rem;
    margin: 0.3rem 0;
    line-height: 1.6;
    font-weight: 400;
  `,
  caption: css`
    font-size: 0.75rem;
    margin: 0.25rem 0;
    line-height: 1.7;
    font-weight: 300;
  `,
  overline: css`
    font-size: 0.75rem;
    text-transform: uppercase;
    margin: 0.25rem 0;
    line-height: 1.7;
    font-weight: 300;
  `,
};
const colors = {
  primary: css`
    color: #007BFF;
  `,
  secondary: css`
    color: #6C757D;
  `,
  success: css`
    color: #28A745;
  `,
  danger: css`
    color: #DC3545;
  `,
  warning: css`
    color: #FFC107;
  `,
  info: css`
    color: #17A2B8;
  `,
  light: css`
    color: #F8F9FA;
  `,
  dark: css`
    color: #343A40;
  `,
};

const Typography = ({
  variant,
  color,
  align,
  display,
  gutterBottom,
  noWrap,
  paragraph,
  component: Component = 'div',
  className,
  children
}) => {
  const TypographyStyle = styled(Component)`
    margin: 0;
    text-align: ${align};
    display: ${display};
    margin-bottom: ${gutterBottom ? '1rem' : '0'};
    white-space: ${noWrap ? 'nowrap' : 'normal'};
   ${colors[color] || colors.dark};
    ${variants[variant]};
  `;

  return (
    <TypographyStyle className={className}>
      {children}
    </TypographyStyle>
  );
};

Typography.propTypes = {
  variant: PropTypes.oneOf(Object.keys(variants)),
  color: PropTypes.string,
  align: PropTypes.oneOf(['left', 'right', 'center', 'justify']),
  display: PropTypes.oneOf(['initial', 'block', 'inline']),
  gutterBottom: PropTypes.bool,
  noWrap: PropTypes.bool,
  paragraph: PropTypes.bool,
  component: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  className: PropTypes.string,
};

export default Typography;
