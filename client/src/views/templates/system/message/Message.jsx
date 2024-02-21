
import React from 'react'
import styled from 'styled-components'

export const Message = ({title, bgColor, fontSize, width}) => {
  return (
    <Container 
    bgColor={bgColor}
    fontSize={fontSize}
    width={width}
    >
      {title}
      </Container>
  )
}
const Container = styled.div`
    height: 1.6em;
    display: flex;
    align-items: center;
    padding: 0 0.4em;
    border-radius: 6px;
    color: black;
    width: min-content;
    
   ${props => {
    switch (props.width) {
      case 'auto':
        return`
          width: auto;
        `
    
      default:
        break;
    }
   }}
    ${props => {
      switch (props.fontSize) {
        case 'small':
          return`
            font-size: 13px;
          `
          case 'normal':
          return`
            font-size: 16px;
          `
          case 'large':
          return`
            font-size: 18px;
          `
         
        default:
          break;
      }
    }}
    ${props => {
        switch (props.bgColor) {
            case 'error':
                return`
                background-color: rgba(255, 0, 0, 0.100);
                color: var(--Gray10)
                `
            case 'primary':
                return`
                background-color:  rgba(0, 129, 250, 0.100);
                color: var(--Black4);
                `
            default:
                break;
        }
    }}
`