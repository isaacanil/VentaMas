import React, {Fragment} from 'react'
import styled from 'styled-components'
import { useDispatch } from 'react-redux'
import {
  FloatingMessage
} from '../../../'

export const PurchaseButton = () => {
   
  return (
    <Fragment>
      <FloatingMessage title='Comprar'>
            <Container>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M24 0C10.7 0 0 10.7 0 24S10.7 48 24 48H76.1l60.3 316.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24-10.7 24-24s-10.7-24-24-24H179.9l-9.1-48h317c14.3 0 26.9-9.5 30.8-23.3l54-192C578.3 52.3 563 32 541.8 32H122l-2.4-12.5C117.4 8.2 107.5 0 96 0H24zM176 512c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48zm336-48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48z"/></svg>
            </Container>
      </FloatingMessage>
    </Fragment>
  )
}
const Container = styled('div')`
    width: 32px;
    height: 32px;
    padding: 0.2em;
    display: flex;
    justify-content: center;
    align-items: center;      
    border-radius: 100px;
    background-color: white;
    
    border: 1px solid rgba(0, 0, 0, 0.307);
    svg{
        width: 1em;
        fill: rgba(31, 31, 31, 0.72);
    }
`