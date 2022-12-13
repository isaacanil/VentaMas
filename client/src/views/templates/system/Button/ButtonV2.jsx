import React, { useState } from 'react'
import styled from 'styled-components'

export const Button = () => {
  const [isActivated, setIsActivated] = useState()
  return (
    <Container isActivated={isActivated ? 'true' : 'false'}>ButtonV2</Container>
  )
}
const Container = styled.div`
    height: 2em;
    width: 2em;
    ${props => {
    switch (props.isActivated) {
      case 'true':
        return `
            background-color: #00000071;    
            `
      case 'false':
        return`
            background-color: #fff;
        `
      default:
        break;
    }
  }}
`