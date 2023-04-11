import React, { Fragment, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { MdClose, MdSearch } from 'react-icons/md';
import { useFormik, } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAsterisk } from '@fortawesome/free-solid-svg-icons';


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
export const InputV4 = ({ icon, label, type, search, onClear, validate, errorMessage, bgColor, clearButton, ...props }) => {
  const [showClearButton, setShowClearButton] = useState(false);

  useEffect(()=>{setShowClearButton(Boolean(props.value))},[props.value])

  const handleClearInput = () => {
  
      onClear();
   
  };

  return (
    <div>
      {label && 
      <Fragment>
        <Label>{label}</Label> 
      </Fragment> }
      <InputWrapper bgColor={bgColor} search={search} validate={validate}>
        {icon}
        <StyledInput {...props} />
        { (onClear && showClearButton) && (
          <MdClose
            onClick={handleClearInput}
            style={{ cursor: 'pointer', marginLeft: '8px', color: '#999' }}
          />
        )}
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

  border-radius: 4px;
  padding: 2px 8px;
  height: 2em;

  position: relative;
  width: 100%;
  max-width: ${props => props.search ? '280px' : null};
  background: ${props => props.bgColor || 'white'};
  svg {
    font-size: 14px;
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
 
`;

const StyledInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  padding: 0 8px;
  font-size: 14px;
  height: 100%;
  color: rgb(51, 51, 51);
  width: 100%;
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