import React from 'react'
import { ConfirmCancelButtons } from '../../../../resource/ConfirmCancelButtons/ConfirmCancelButtons'
import styled from 'styled-components'

export const Footer = ({onSubmit, onCancel}) => {
  
  return (
    <Container>
         <ConfirmCancelButtons onSubmit={onSubmit} onCancel={onCancel} />
    </Container>
  )
}
const Container = styled.div`
    background-color: white;
    padding: 0.4em;
    position: sticky;
    bottom: 2px;
    border-radius: var(--border-radius);
    border: var(--border-primary);
`