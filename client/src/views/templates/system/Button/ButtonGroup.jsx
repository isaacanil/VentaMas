import React from 'react'
import styled from 'styled-components'

export const ButtonGroup = ({children, position}) => {
  return (
    <Container position={position}>
        {children}
    </Container>
  )
}

const Container = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4em;
    ${(props) => {
      switch (props.position) {
        case 'right':
          return`
            align-items: end;
          `
      
        default:
          break;
      }
    }}
`