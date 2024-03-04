import React from 'react'
import { useDispatch } from 'react-redux'
import { useMatch } from 'react-router-dom'
import styled from 'styled-components'
import { SelectProduct } from '../../../features/addOrder/addOrderModalSlice'

export const ProductCard = ({ data, setShowProductList, fn, close }) => {

  const handleProductSelected = async () => {
    try {

      fn(data);
      close();
    } catch (error) {
      console.log(error)
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
    height: 2.4em;
    display: flex;
    align-items: center;
    padding: 0 0.6em;
    background-color: var(--White);
    border-radius: var(--border-radius-light);
    
`