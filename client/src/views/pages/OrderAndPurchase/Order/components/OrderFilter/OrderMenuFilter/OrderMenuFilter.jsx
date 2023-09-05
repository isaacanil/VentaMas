import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { orderAndDataCondition, orderAndDataState } from '../../../../../../../constants/orderAndPurchaseState'
import { Item } from './Item'


export const OrderMenuFilter = ({ options = [] }) => {

  return (
    <Container>
      {
        options.map((item, index) => (
          <Item
            key={index}
            name={item.name}
            data={item.data}
            option={item.option}
            onClick={item.onClick}
            value={item.value}
            default={item.default}
          />
        ))
      }
    </Container>

  )
}

const Container = styled.div`
  display: flex;
  padding: 0.2em;
`
const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow-y: scroll;
`
const Head = styled.div`
  background-color: var(--White);

  h3{
    margin: 0;
    padding: 0.4em 1em;
  }
`
const Body = styled.div`

`