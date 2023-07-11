import React from 'react'
import logo from './ventamax.svg'
import styled from 'styled-components'
export const Logo = ({ size }) => {
  return (
    <Component>
      <Img src={logo} size={size} alt="" />
    </Component>
  )
}

const Component = styled.div`
display: flex;
width: min-content;

`
const Img = styled.img`
   display: block;
    ${(props) => {
    switch (props.size) {
      case 'small':
        return `
          height: 2em;
          width: 2em;
          `
      case 'medium':
        return `
          height: 4em;
          width: 4em;
          `
      case 'large':
        return `
          height: 6em;
          width: 6em;
          `

      case 'xlarge':
        return `
          height: 10em;
          width: 10em;
          
          `
      default:
        return `
          height: 4em;
          width: 4em;
          `
    }
  }
  }
`