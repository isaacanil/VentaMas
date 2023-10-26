import React from 'react'
import logo from './ventamax.svg'
import styled from 'styled-components'
export const Logo = ({ size }) => {
  return (
    <Component>
      <Img
        src={logo}
        size={size}
        alt=""
      />
    </Component>
  )
}

const Component = styled.div`
display: flex;
width: min-content;

`
const imgSize = {
  xsmall: '1.5rem',
  small: '2rem',
  medium: '4rem',
  large: '6rem',
  xlarge: '10rem',
  xxlarge: '12rem',
}
const Img = styled.img`
  display: block;
  height: ${(props) => props.size ? imgSize[props.size ] : imgSize["medium"]};
  width: ${(props) => props.size ? imgSize[props.size ] : imgSize["medium"]};
`