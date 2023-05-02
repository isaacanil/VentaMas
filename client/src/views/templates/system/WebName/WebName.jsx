import React from 'react'
import styled from 'styled-components'

const Container = styled('div')`
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.200);
  padding: 0 0.8em;
  height: 2em;
  width: min-content;
  border-radius: 10px;
`
const WebNameItem = styled('span')`
  font-size: 1.2em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: bold;
  color: #f3f3f3;
  
  ${(props) => {
    switch (props.size) {
      case "large":
        return `
       display: block;
        width: 100%;
        font-weight: 600;
        text-align: center;
        margin: 0 auto;
        text-transform: uppercase;
        letter-spacing: 0.1rem;
        cursor: pointer;
        transition: all 0.3s ease-in-out;
        color: #f3f3f3;
        &:hover {
          color: #f1f1f1;
        } font-size: 1.3em;
        
      `
    }
  }}
  
  
`
export const WebName = ({size}) => {
  return (
    <Container>
      <WebNameItem size={size}>VENTAMAX</WebNameItem>
    </Container>
  )
}
