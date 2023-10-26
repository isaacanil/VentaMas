import React from 'react';
import { TypographyStyle, variantToComponentMap } from './style/TypographyStyles';

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
const Typography = ({
  variant = 'body1',
  context = 'app',
  color = 'dark',
  align = 'left',
  display = 'block',
  gutterBottom = false,
  disableMargins = false,
  noWrap = false,
  component: ComponentProp,
  className,
  size = 'medium', 
  italic = false,
  strikethrough = false,
  textShadow = null,
  children,
  bold = false, 
  underline = false, 
  ...rest
}) => {

  const Component = ComponentProp || variantToComponentMap[variant] || 'span';
  return (
    <TypographyStyle
      as={Component}
      context={context}
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

export default Typography;
