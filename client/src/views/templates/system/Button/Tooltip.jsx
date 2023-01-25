import React, { Children, useRef, useState } from 'react'
import styled from 'styled-components'

export const Tooltip = ({ description = null, Children, placement }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Container
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      
    >
      {Children}
      {isVisible && <Message placement={placement}>{description}</Message>}

    </Container>
  )
}
const Container = styled.div`
  width: min-content;
  position: relative;
    
`
const Message = styled.div`
  background-color: rgba(0, 0, 0, 0.87);
  color: white;
  padding: 2px 8px;
  border-radius: var(--border-radius-light);
  position: absolute;
  width: auto;
  white-space: nowrap;
  z-index: 2;
  font-size: 12px;
  transform: scale(1);
  
  ${(props) => {
    switch (props.placement) {
      case 'top-start':
        return `
          top: 100%;
          left: 0;
         
        `
      case 'top':
        return `
        left: 50%;
        transform: translateX(-50%);
        top: -100%;
        `
        return `
          
        `
      case 'top-end':`
      top: 100%;
          right: 0;
      `
      case 'left-start':
        return `
          
        `
      case 'left':
        return `
          
        `
      case 'left-end':
        return `
          
        `
      case 'right-start':
        return `
          
        `
      case 'right':
        return `
          
        `
      case 'right-end':
        return `
          
        `
      case 'bottom-start':
        return `
        bottom: -100%;
        left: 0;
        `
      case 'bottom':
        return `
        left: 50%;
        transform: translateX(-50%);
        bottom: -100%;
          
        `
      case 'bottom-end':
        return `
        bottom: -100%;
        right: 0;
        `


      default:
        break;
    }
  }}
  ${(props) => {
    switch (props.isVisible) {
      case false:
        return`
          transform: scale(0);
        `
    
      default:
        break;
    }
  }}
`