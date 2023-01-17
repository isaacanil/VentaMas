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
                    background-color: #e64747;
                `
            case 'yellow':
                return`
                    background-color: #f7e43c;
                `
            case 'green':
                return`
                    background-color: #45db59;
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