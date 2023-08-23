import React, { Fragment, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { MdClose, MdSearch } from 'react-icons/md';
import { icons } from '../../../../constants/icons/icons';



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
export const InputV4 = ({ icon, label, labelVariant, size, search, onClear, validate, errorMessage, bgColor, clearButton = false, ...props }) => {
  const showClearButton = clearButton && props.value;
  const inputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Backdrop>
      {label &&
        <Fragment>
          <Label labelVariant={labelVariant}>{label}</Label>
        </Fragment>}
      <InputWrapper size={size} {...props} bgColor={bgColor} search={search} validate={validate}>
        {icon}
        <StyledInput {...props} type={showPassword ? 'text' : props.type} ref={inputRef} />

        {props.type === 'password' ? (
          showPassword ? (
            <Button onClick={() => setShowPassword(!showPassword)}>
              {icons.input.password.show}
            </Button>
          ) : (
            <Button onClick={() => setShowPassword(!showPassword)}>
              {icons.input.password.hide}
            </Button>
          )
        ) : null}
        {onClear && <MdClose
          onClick={() => onClear()}
          style={{ cursor: 'pointer', marginLeft: '8px', color: `${props.value ? "#999" : "transparent"}` }}
        />}
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
const Backdrop = styled.div`
position: relative;
`
const InputWrapper = styled.div.attrs(() => ({
  tabIndex: 0
}))`
  display: flex;
  align-items: center;

  color: rgb(51, 51, 51);
  
  border: 1px solid #ccc;
  border-radius: 4px;

  padding:0 8px;
  height: 2em;
  width: 100%;
  max-width: ${props => props.search ? '280px' : null};

  position: relative;

  background: ${props => props.bgColor || 'white'};
  svg {
    font-size: 18px;
    color: #999;
    
  }
  transition: all 0.3s ease, width 0.300ms linear;

  /* Para Chrome, Safari y Opera */
input[type="number"]::-webkit-inner-spin-button, 
input[type="number"]::-webkit-outer-spin-button { 
  -webkit-appearance: none;
  margin: 0;
}

/* Para Firefox */
input[type="number"] {
  -moz-appearance: textfield;
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
            padding: 0.2em 0.4em;
      `
      case 'medium':
        return `
            height: 2.6em;
            font-size: 14px;
            padding: 0 10px;
        `
      case 'large':
        return `
                    height: 2.8em;
                    font-size: 16px;
                    padding: 0 10px;
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
  padding: 0 8px;
  font-size: 14px;
  height: 100%;
  color: inherit;
  font-weight: inherit;
  width: 100%;
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