import React from 'react'
import styled from 'styled-components'
import { InputV4 } from './InputV4'

export const SearchInput = ({onClear, ...props}) => {
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
    clearButton={true}
    onFocus={handleFocus}
    onBlur={handleBlur} 
    
    />
  )
}

const Input = styled(InputV4)`
`
