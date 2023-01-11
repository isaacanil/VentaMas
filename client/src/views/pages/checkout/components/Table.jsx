
import React from 'react'
import styled from 'styled-components'

export const Row = ({cols}) => {
  return (
    <RowContainer cols={cols}></RowContainer>
  )
}
const RowContainer = styled.div`
display: grid;
grid-template-columns: 1fr;
    ${props => {
        switch (props.cols) {
            case '1':
            return`


            `

            case '3':
            return`
            grid-template-columns: 1fr 0.8fr 0.8fr;

            `
            default:
                break;
        }
    }}
`

export const Col = ({textAlign}) => {
  return(
    <ColContainer textAlign={textAlign}>

    </ColContainer>
  )
}
const ColContainer = styled.div`
  ${props => {
    switch (props.textAlign) {
      case 'left':
        return`
        text-align: 'left'
        `
      case 'right':
        return`
        text-align: 'right'
        `
      case 'center':
        return`
        text-align: 'center'
        `
      default:
        break;
    }
  }}
`