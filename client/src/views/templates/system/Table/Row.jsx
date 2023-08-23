import React from 'react'
import styled from 'styled-components'

export const Row = ({ children, col, element }) => {
    
    return (
        <Container col={col} element={element}>
            {children}
        </Container>
    )
}
const Container = styled.div`
  display: grid;
  width: 100%;
  gap: 1em;

  grid-template-columns: 
    ${(props) => {
        if (props.col) {
            return props?.col?.map(({ min, max }) => {
                return `minmax(${min},${max})`
            })
        }
    }};
  ;
  
`