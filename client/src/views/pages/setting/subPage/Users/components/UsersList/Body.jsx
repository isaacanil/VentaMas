import React from 'react'
import styled from 'styled-components'

export const Body = ({ data, Item, colWidth }) => {
  return (
    <Container>
      {
        data.map((item, index) => (
          <Item key={index} num={index} data={item} colWidth={colWidth} />
        ))
      }
    </Container>
  )
}


const Container = styled.div`
    height: 100%;
    width: 100%;
 
`