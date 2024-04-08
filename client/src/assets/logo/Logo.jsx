import React from 'react'
import logo from './ventamax.svg'
import styled from 'styled-components'
export const Logo = ({ size = "medium" }) => {
  return (
      <Img
        src={logo}
        size={size}
        alt=""
      />
  )
}

const imgSize = {
  xsmall: '1.5rem',
  small: '3rem',
  medium: '5rem',
  large: '6rem',
  xlarge: '10rem',
  xxlarge: '12rem',
}
const Img = styled.img`
  display: block !important;
  height: ${(props) => props.size ? imgSize[props.size ] : imgSize["medium"] } !important;
  width: ${(props) => props.size ? imgSize[props.size ] : imgSize["medium"]} !important;
`