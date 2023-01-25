import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { selectOrderFilterOptions } from '../../../../../../features/order/ordersSlice'
import { Item } from './Item'

export const OrderMenuFilter = ({ MenuIsOpen }) => {
  const OrderFilterOptionsSelected = useSelector(selectOrderFilterOptions)
  const propertiesName = [
    'provider'
  ]
  return (
    <Container isOpen={MenuIsOpen ? true : false}>
      <Head>
        <h3>Filtros</h3>
      </Head>
      <Body>
        {
          OrderFilterOptionsSelected.length > 0 ? (
            OrderFilterOptionsSelected.map((item, index) => (
                <Item data={item} index={index}  key={index} />
              ))       
          ) : null
        }
      </Body>
    </Container>
  )
}

const Container = styled.div`
  overflow: hidden;
  overflow-y: scroll;
  max-height: 500px;
  height: 100%;
  max-width: 500px;
  width: 100%;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.150);
  
  top: 5.2em;
  position: absolute;
  z-index: 1;
  background-color: #ffffff;
  transform: scale(1);
  transition: transform 400ms ease-in-out;
  transform: perspective();
  box-shadow: 10px 10px 10px 2px rgba(0, 0, 0, 0.150);
  @media (max-width: 600px){
    left: 0;
    max-width: none;
    border-radius: 0;
    width: 100%;
    max-height: none;
    height: calc(100vh - 4.75em);
    margin: 0;
    border: 0;
  }
  ${props => {
    switch (props.isOpen) {
      case true:
        return `
        transform: scaleX(1) translateX(0px) translateY(0px);
        `

      case false:
        return `   
        transform: scale(0) translateX(-400px) translateY(-100px);
        `

      default:
        break;
    }
  }}
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