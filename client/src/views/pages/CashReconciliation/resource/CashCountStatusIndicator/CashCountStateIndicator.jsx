import React from 'react'
import styled from 'styled-components'

const handleLabelState = (state) => {
  if(!state) return ('Pendiente')
 
  const stateLabels = {
    open: 'Abierto',
    closing: 'Cerrando Cuadre',
    closed: 'Cerrado',
    pending: 'Pendiente',
  }
  return stateLabels[state] || '';
}

export const CashCountStateIndicator = ({state}) => {
  const stateLabel = handleLabelState(state) 
  
  return (
    <Container state={state}>{stateLabel}</Container>
  )
}

const Container = styled.div`
padding: 0.2em 0.4em;
border-radius: 100px;
white-space: nowrap;
width: min-content;
    ${(props) => {
    switch (props.state) {
      case 'open':
        return `
          background-color: var(--color-success-light);
          color: var(--color-success-dark);
        `
        case 'closing':
          return `
            background-color: var(--color-warning-light);
            color: var(--color-warning-dark);
          `
      case 'closed':
        return `
          background-color: var(--color-danger-light);
          color: var(--color-danger-dark);
          `
      default:
        break;
    }
  }}
`