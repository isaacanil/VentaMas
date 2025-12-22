import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fragment, useRef } from 'react';
import styled from 'styled-components';

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
export const TextareaV2 = ({
  icon,
  label,
  search,
  onClear,
  validate,
  errorMessage,
  bgColor,
  clearButton = false,
  ...props
}) => {
  const inputRef = useRef(null);

  return (
    <div>
      {label && (
        <Fragment>
          <Label>{label}</Label>
        </Fragment>
      )}
      <InputWrapper
        {...props}
        bgColor={bgColor}
        search={search}
        validate={validate}
      >
        {icon}
        <StyledInput {...props} ref={inputRef} />
        {onClear && clearButton && (
          <FontAwesomeIcon
            icon={faTimes}
            onClick={() => onClear()}
            style={{
              cursor: 'pointer',
              marginLeft: '8px',
              color: `${props.value ? '#999' : 'transparent'}`,
            }}
          />
        )}
      </InputWrapper>
      {validate && errorMessage && (
        <ErrorMessage show>{errorMessage}</ErrorMessage>
      )}
    </div>
  );
};

const InputWrapper = styled.div.attrs(() => ({
  tabIndex: 0,
}))`
  display: flex;
  align-items: center;
  border-radius: 4px;
  height: 5em;
  outline: none;
  position: relative;
  width: 100%;
  max-width: ${(props) => (props.search ? '280px' : null)};
  background: ${(props) => props.bgColor || 'white'};

  svg {
    font-size: 18px;
    color: #999;
  }

  transition:
    all 0.3s ease,
    width 0.3ms linear;
  border: ${(props) => {
    if (props.validate === 'pass') {
      return '1px solid #00c853';
    } else if (props.validate === 'fail') {
      return '1px solid #ff3547';
    } else {
      return '1px solid #ccc';
    }
  }};
  ${(props) =>
    props.disabled &&
    `
      background-color: #f8f8f8;
  `}
`;

const StyledInput = styled.textarea`
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 0.6em;
  font-size: 14px;
  color: rgb(51 51 51);
  resize: none;
  outline: none;
  background: transparent;
  border: none;

  &::placeholder {
    color: #999;
  }
`;

const ErrorMessage = styled.span`
  display: ${({ $show }) => ($show ? 'inline' : 'hidden')};
  margin-left: 8px;
  font-size: 12px;
  color: #ff3547;
`;
const Label = styled.label`
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--gray-5);
`;
