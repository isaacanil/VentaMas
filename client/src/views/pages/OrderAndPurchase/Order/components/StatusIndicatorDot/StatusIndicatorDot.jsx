import React from 'react'
import styled from 'styled-components'

export const StatusIndicatorDot = ({color}) => {
    console.log(color)
  return (
    <Container color={color}>

    </Container>
  )
}
const Container = styled.div`
    height: 0.6em;
    width: 1.2em;
    border-radius: 10px;
    background-color: ${props => props.color};
`