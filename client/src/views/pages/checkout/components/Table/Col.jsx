import React from 'react'
import styled from 'styled-components'

export const Col = ({textAlign, children}) => {
    return(
      <Container textAlign={textAlign}>
        {children}
      </Container>
    )
  }
  const Container = styled.div`
  width: 100%;
    display: flex;
    ${props => {
      switch (props.textAlign) {
        case 'left':
          return`
          justify-content: flex-start;

          `
        case 'right':
          return`
            justify-content: flex-end;
       
          `
        case 'center':
          return`
          justify-content: center;
          `
        default:
          break;
      }
    }}
  `