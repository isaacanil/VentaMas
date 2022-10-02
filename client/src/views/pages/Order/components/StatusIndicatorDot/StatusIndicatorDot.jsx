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
    width: 1.1em;
    border-radius: 100px;
    ${(props)=>{
        switch (props.colorRef) {
            case 'red':
                return`
                    background-color: #dd2222;
                `
            case 'yellow':
                return`
                    background-color: #ffe600;
                `
            case 'green':
                return`
                    background-color: #20bd35;
                `
            case 'gray':
                return`
                    background-color: #777777;
                `
                
              
        
            default:
                break;
        }
    }}
`