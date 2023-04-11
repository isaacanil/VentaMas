import React from 'react'
import styled from 'styled-components'
import { InputV4 } from './InputV4'

export const SearchInput = ({...props}) => {
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
    onFocus={handleFocus}
    onBlur={handleBlur} 
    
    />
  )
}

const Input = styled(InputV4)`
`
