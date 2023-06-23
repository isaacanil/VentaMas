import React, { Fragment, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { MdClose, MdSearch } from 'react-icons/md';

/**
 * @typedef {Object} InputV4
 * @property {string} label - The value for MiComponente.
 * @property {string} [opcion] - An optional property for MiComponente.
 */

/**
 * A custom MiComponente component.
 * @param {InputV4} props
 * @returns {JSX.Element}
 */
export const TextareaV2 = ({ icon, label, search, onClear, validate, errorMessage, bgColor, clearButton = false, ...props }) => {
  const showClearButton = clearButton && props.value;
  const inputRef = useRef(null);
  const inputValue = props.value

  return (
    <div>
      {label && 
      <Fragment>
        <Label>{label}</Label> 
      </Fragment> }
      <InputWrapper {...props} bgColor={bgColor} search={search} validate={validate}>
        {icon}
        <StyledInput {...props} ref={inputRef} />
     
       {onClear && <MdClose
            onClick={() => onClear()}
            style={{ cursor: 'pointer', marginLeft: '8px', color: `${props.value ? "#999" : "transparent"}` }}
          />}
        
      </InputWrapper>
      {(validate && errorMessage) && <ErrorMessage show>{errorMessage}</ErrorMessage>}
    </div>
  );
};

const InputWrapper = styled.div.attrs(() => ({
  tabIndex: 0
}))`
  display: flex;
  align-items: center;
  border: 1px solid #ccc;
  background-color: white;
  border-radius: 4px;
 
  height: 5em;
  outline: none;
  position: relative;
  width: 100%;
  max-width: ${props => props.search ? '280px' : null};
  background: ${props => props.bgColor || 'white'};
  svg {
    font-size: 18px;
    color: #999;
    
  }
  transition: all 0.3s ease, width 0.300ms linear;
  border: ${ props => {
    if(props.validate === 'pass') {
      return '1px solid #00c853';
    } else if (props.validate === 'fail') {
      return '1px solid #ff3547';
    } else {
      return '1px solid #ccc';
    }
  }};
    ${props => props.disabled && `
      background-color: #f8f8f8;
  `}
 
`;

const StyledInput = styled.textarea`
  border: none;
  outline: none;
  flex: 1;
  padding: 0.6em;
  font-size: 14px;
  height: 100%;
  resize: none;
  color: rgb(51, 51, 51);
  width: 100%;
  background: transparent;
  &::placeholder {
    color: #999;
  }

`;

const ErrorMessage = styled.span`
  color: #ff3547;
  font-size: 12px;
  margin-left: 8px;
  display: ${props => props.show ? 'inline' : 'hidden'};
`;
const Label = styled.label`
  font-size: 13px;
 color: var(--Gray5);


  margin-bottom: 4px;
`