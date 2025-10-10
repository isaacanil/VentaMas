import React from 'react'
import styled from 'styled-components'


export const ProductCard = ({ data, fn, close }) => {

  const handleProductSelected = async () => {
    try {

      fn(data);
      close();    } catch (error) {
      // Handle error appropriately
    }
  }
  return (
    <Container onClick={handleProductSelected}>
      <span>
        {data.name}
      </span>
    </Container>
  )
}
const Container = styled.div`
    min-height: 2.4em;
    height: min-content;
    display: flex;
    align-items: center;
    padding: 0 0.6em;
    background-color: var(--White);
    border-radius: var(--border-radius-light);
    
`