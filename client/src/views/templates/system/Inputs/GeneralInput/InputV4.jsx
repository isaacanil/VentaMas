import React, { Fragment, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { MdClose, MdSearch } from 'react-icons/md';
import { icons } from '../../../../../constants/icons/icons';
import { formatNumber } from '../../../../../utils/number/number';
import { useCallback } from 'react';

/**
 * @typedef {Object} InputV4
 * @property {string} label - The value for MiComponente.
 * @property {string} [opcion] - An optional property for MiComponente.
 * @property {string} [size] - An optional property for MiComponente.
 * @property {string} [themeColor] - An optional property for MiComponente.
 * @property {string} [labelVariant] - An optional property for MiComponente.
 * @property {string} [bgColor] - An optional property for MiComponente.
 * @property {string} [type] - An optional property for MiComponente.
 * @property {string} [value] - An optional property for MiComponente.
 * @property {string} [placeholder] - An optional property for MiComponente.
 * @property {string} [onChange] - An optional property for MiComponente.
 * @property {string} [onClear] - An optional property for MiComponente.
 * @property {string} [validate] - An optional property for MiComponente.
 * @property {string} [errorMessage] - An optional property for MiComponente.
 * @property {string} [search] - An optional property for MiComponente.
 * @property {string} [clearButton] - An optional property for MiComponente.
 * @property {string} [icon] - An optional property for MiComponente.
 * @property {string} [disabled] - An optional property for MiComponente.
 * @property {string} [onFocus] - An optional property for MiComponente.
 * @property {string} [onBlur] - An optional property for MiComponente.
 * @property {string} [onKeyDown] - An optional property for MiComponente.
 * @property {string} [onKeyUp] - An optional property for MiComponente.
 * @property {string} [onKeyPress] - An optional property for MiComponente.
 * @property {string} [onPaste] - An optional property for MiComponente.
 * @property {string} [onCopy] - An optional property for MiComponente.
 * @property {string} [onCut] - An optional property for MiComponente.
 * @property {string} [onCompositionStart] - An optional property for MiComponente.
 * @property {string} [onCompositionEnd] - An optional property for MiComponente.
 * @property {string} [onCompositionUpdate] - An optional property for MiComponente.
 */

/**
 * A custom MiComponente component.
 * @param {InputV4} props
 * @returns {JSX.Element}
 */

const DEFAULT_ICONS = {
  date: icons.forms.date,
  password: icons.forms.password,
  email: icons.forms.email,
  search: icons.forms.search,

};
const limpiarValorCadena = (valor, type) => {
  // Quita espacios innecesarios del inicio y final
  if(type !== 'number'){
    return  valor;
  }
  valor = valor.trim();
  // Quita ceros innecesarios del inicio
  valor = valor.replace(/^0+(?!\.)/, '');
  // Quita ceros innecesarios del final de un número decimal
  valor = valor.replace(/(\.\d*?[1-9])0+$/, '$1');
  // Quita el punto decimal si no quedan dígitos después de él
  valor = valor.replace(/\.$/, '');

  return valor;
};
const limpiarValorNumero = (valor, type) => {
  // Asume que el valor de entrada es numérico y no necesita conversión a cadena
  if (type === 'number') {
    // Si el valor es un entero, no habrá ceros a la derecha para eliminar
    if (Number.isInteger(valor)) return valor;
    // Convertir a cadena para procesar decimales
    let valorComoCadena = valor.toString();
    // Quita ceros innecesarios al final de un número decimal
    valorComoCadena = valorComoCadena.replace(/(\.\d*?[1-9])0+$/, '$1');
    // Convierte de nuevo a número
    valor = Number(valorComoCadena);
  }
  return valor;
};



export const InputV4 = ({
  focusWhen,
  autoFocus,
  id = "",
  icon,
  label,
  labelVariant,
  marginBottom,
  size,
  search,
  onClear,
  validate,
  errorMessage,
  bgColor,
  clearButton = false,
  value,
  type = 'text',
  ...props
}) => {
  const inputRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);

  const defaultIcon = DEFAULT_ICONS[type] || null;
  const renderedIcon = icon || defaultIcon;

  useEffect(() => {
    if (inputRef.current && autoFocus) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (inputRef.current && focusWhen) {
      inputRef.current.focus();
    }
  }, [focusWhen]);

  const handleClearClick = () => {
    if (onClear && value) onClear();
  };

  const toggleShowPassword = () => {
    setShowPassword(prevShowPassword => !prevShowPassword);
  };
  // Función unificada para limpiar valores
const limpiarValor = useCallback((valor) => {
  if (typeof valor === 'string') {
    return limpiarValorCadena(valor) || "";
  } else if (typeof valor === 'number') {
    return limpiarValorNumero(valor) || "";
  }
  return valor;
}, [value]);

  return (
    <Backdrop marginBottom={marginBottom}>
      <Header>
        {label &&
          <Label htmlFor={id} labelVariant={labelVariant} >{label}</Label>
        }
        {
          props.required &&
          <Asterisk style={{ color: 'red', }}>{icons.forms.asterisk}</Asterisk>
        }
      </Header>
      <InputWrapper
        size={size}
        bgColor={bgColor}
        search={search}
        validate={validate}
        {...props}

      >
        {
          renderedIcon && (
            <Icon>
              {renderedIcon}
            </Icon>
          )
        }
        <StyledInput
          ref={inputRef}
          id={id}
          {...props}
          type={showPassword ? 'text' : type}
          autoComplete='off'
          value={limpiarValor(value, type)}
          onInvalid={(e) => {
            e.preventDefault();
            e.target.setCustomValidity('Por favor, complete este campo.');
          }}
        />
        {
          (value && onClear) ? (
            <Icon
              onClick={handleClearClick}
              style={{ cursor: 'pointer', marginLeft: '8px', position: 'relative', zIndex: '100', color: `${value ? "#999" : "transparent"}` }}
            >
              {icons.operationModes.close}
            </Icon>
          ) : null
        }

        {type === 'password' ? (
          <Button onClick={toggleShowPassword}>
            {showPassword ? icons.input.password.hide : icons.input.password.show}
          </Button>
        ) : null}
      </InputWrapper>
      {(validate && errorMessage) && (
        <ErrorContainer>
          {
            Array.isArray(errorMessage) ?
              errorMessage.map((message, index) =>
                <ErrorMessage key={index} show>{message}</ErrorMessage>
              )
              : <ErrorMessage show>{errorMessage}</ErrorMessage>
          }
        </ErrorContainer>
      )}
    </Backdrop>
  );
};
const Asterisk = styled.span`
  color: red;
  svg{
    font-size: 0.8em;
  }
  padding-left: 8px;

`
const Backdrop = styled.div`
position: relative;
${props => props.marginBottom && `
margin-bottom: 1em;
`}

`

const Header = styled.div`
display: flex;
`
const Icon = styled.div`
display: flex;
align-items: center;
justify-content: center;
height: 2em;
width: 1.6em;
   svg {
    font-size: 18px;
    color: #999;
  }
`
const InputWrapper = styled.div.attrs(() => ({
  tabIndex: 0
}))`
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgb(51, 51, 51);
  border: 2px solid #ccc;

  border-radius: 4px;
  &:focus-within {
    ${props => props.disabled || props.readOnly ? null : `
    outline: 2px solid #6b93ff;
    `}
    
  }
  padding:0 2px;
  height: 2em;
  width: 100%;
  max-width: ${props => props.search ? '280px' : null};

  position: relative;

  background: ${props => props.bgColor || 'white'};
 
  transition: all 0.3s ease, width 0.300ms linear;

  /* Para Chrome, Safari y Opera */
input[type="number"]::-webkit-inner-spin-button, 
input[type="number"]::-webkit-outer-spin-button { 
  -webkit-appearance: none;
  margin: 0;
}

input[type="date"]{
  width: min-content !important;
}

  border: ${props => {
    if (props.validate === true) {
      return '1px solid #00c853';
    } else if (props.validate === false) {
      return '1px solid #ff3547';
    } else {
      return '1px solid #ccc';
    }
  }};
   ${props => props.disabled && `
    background-color: #f8f8f8;
    color: #999;
  `}
   ${props => {
    switch (props.themeColor) {
      case 'success':
        return `
                    color: var(--color-success-dark);
                    background-color: var(--color-success-light);
                    font-weight: 600;
                `
      case 'danger':
        return `
                    color: var(--color-danger-dark);
                    background-color: var(--color-danger-light);
                    font-weight: 600;
                `
    }
  }}
  ${props => {
    switch (props.size) {
      case 'small':
        return `   
            height: 2.4em;
            font-size: 12px;  
           
      `
      case 'medium':
        return `
            height: 2.6em;
            font-size: 14px;
         
        `
      case 'large':
        return `
                    height: 2.2em;
                    font-size: 16px;
                
                `
      default:
        return `
                    height: 2.3em;
                    font-size: 14px;
                    padding: 0 8px;
                `
    }

  }}
 
`;

const StyledInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  padding: 0 4px;
  font-size: 16px;
  height: 100%;
  color: inherit;
  font-weight: inherit;
  width: 100%;
  :read-only{
    background-color: #f8f8f8;
  }
  ::-webkit-calendar-picker-indicator {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0; /* Esto hará que el ícono sea invisible, pero todavía se puede clicar */
    z-index: 1;
}
  &::placeholder {
    color: #999;
  }
  background-color: transparent;
  
  ${props => props.disabled && `
    background-color: transparent;
  `}
`;

const Label = styled.label`
  font-size: 13px;
 color: var(--Gray5);
  margin-bottom: 4px;
  ${props => {
    switch (props.labelVariant) {
      case 'primary':
        return `
        font-size: 11px;
        color: var(--Gray5);
        position: absolute;
        z-index: 1;
        background-color: white;
        padding: 0 4px;
        top: -5px;
        line-height: 1;
        height: min-content;
        color: #353535;
        font-weight: 600;
    ::after {
      content: ' :';
    }
        `
      case 'label1':
        return `
        font-size: 14px;
        color: var(--Gray5);
        margin-bottom: 4px;
        `
      case 'label2':
        return `
        font-size: 16px;
        color: black;
        margin-bottom: 10px;
        display: block;
        `
      case 'label3':
        return `
        font-size: 12px;
    line-height: 12px;
    display: flex;
       font-weight: 500;
       color: black;
       min-width: 2em;
       height: 1em;
       padding: 0em 0em 0em 0.4em;
       align-items: end;
    `

      default:
        return `
        font-size: 13px;
        color: var(--Gray5);
        margin-bottom: 4px;
        `
    }
  }}
`
const Button = styled.div`
display: flex;
width: 2em;
justify-content: center;
 align-items: center;
`
const ErrorContainer = styled.ul`
  display: grid;
  gap: 2px;
  margin-top: 4px;
  padding: 0;
  margin-bottom: 4px;
  list-style-type: circle !important;
  list-style-position: inside !important;
  background-color: var(--color-danger-light);
  border-radius: var(--border-radius-light);
`;

const ErrorMessage = styled.li`
  color: #ff3547;

  font-size: 14px;
  margin-left: 8px;
  display: ${props => props.show ? 'inline' : 'hidden'};
  ::before {
    content: '• ';
    font-size: large;
    color: #ff3547;
    font-weight: bold;
    height: 100%;
    
  }
`;