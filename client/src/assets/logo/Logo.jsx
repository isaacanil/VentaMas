import React from 'react'
import logo from './ventamax.svg'
import styled from 'styled-components'
export const Logo = () => {
  return (
    <Component>
        <Img src={logo} alt="" /> 
    </Component>
  )
}

const Component = styled.div`
display: flex;
width: min-content;

`
const Img = styled.img`
    height: 4em;
`