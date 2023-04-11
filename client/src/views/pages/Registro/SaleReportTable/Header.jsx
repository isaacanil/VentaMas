import React from 'react'
import styled from 'styled-components'

export const Header = ({ data }) => {
    return (
        data?.table?.headers
            .map(({ align, name }, index) => (
                <ITEMS text={align} key={index}>
                    <h3>{name}</h3>
                </ITEMS>
            ))
    )
}
const ITEMS = styled.div`
  h3{
    text-transform: uppercase;
    font-size: 0.8em;
  }
  width: 100%;
  height: 2em;
  display: grid;
  text-align: center;
  align-items: center;
  ${(props) => {
    switch (props.text) {
      case 'right':
        return `
          text-align: right;
        `
      case 'left':
        return `
          text-align: left;
          `
      default:
        break;
    }
  }}
`