import React from 'react'
import styled from 'styled-components'
import { InputV4 } from './GeneralInput/InputV4'
import { icons } from '../../../../constants/icons/icons';

export const SearchInput = ({ onClear, ...props }) => {
  const handleFocus = () => {
    if (search && inputRef.current === document.activeElement) {
      setPlaceholderText('¿Que desea buscar? ');
    }
  };
  const handleBlur = () => {
    if (search && inputRef.current !== document.activeElement) {
      setPlaceholderText(placeholder);
    }
  };
  return (

    <Input
      {...props}
      onClear={onClear}
      icon={icons.operationModes.search}
      clearButton={true}
      // onFocus={handleFocus}
      // onBlur={handleBlur}
      expandable={true}

    />
  )
}

const Input = styled(InputV4)`
`
