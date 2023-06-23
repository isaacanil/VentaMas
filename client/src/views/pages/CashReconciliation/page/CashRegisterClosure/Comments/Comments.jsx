import React from 'react'
import { TextareaV2 } from './TextareaV2'
import styled from 'styled-components'

export const Comments = ({ icon, label, search, onClear, validate, errorMessage, bgColor, clearButton = false, ...props }) => {
  return (
    <Container>
        <TextareaV2
            label={label}
            placeholder='Escribe aquí ...'
            icon={icon}
            search={search}
            onClear={onClear}
            validate={validate}
            errorMessage={errorMessage}
            bgColor={bgColor}
            clearButton={clearButton}
            
            {...props}
        />
    </Container>
  )
}
const Container = styled.div`
    padding: 0.4em 0.4em; 
    background-color: white;
    border-radius: 0.5em;
    border: var(--border-primary);

`
