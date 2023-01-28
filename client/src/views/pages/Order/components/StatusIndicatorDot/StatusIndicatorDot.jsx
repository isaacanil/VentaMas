import React from 'react'
import styled from 'styled-components'

export const StatusIndicatorDot = ({color}) => {
  return (
    <Container colorRef={color}>

    </Container>
  )
}
const Container = styled.div`
    height: 0.6em;
    width: 1.2em;
    border-radius: 10px;
    ${(props)=>{
        switch (props.colorRef) {
            case 'red':
                return`
                    background-color: #e66767;
                `
            case 'yellow':
                return`
                    background-color: #ebdc54;
                `
            case 'green':
                return`
                    background-color: #7de08b;
                `
            case 'gray':
                return`
                    background-color: #797979;
                `
                
              
        
            default:
                break;
        }
    }}
`