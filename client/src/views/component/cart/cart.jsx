import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import { ClientControl } from '../../index'
import {
  SelectCartIsOpen,
} from '../../../features/cart/cartSlice'
import { ProductsList } from './components/ProductsList/ProductsLit'
import InvoiceSummary from './components/InvoiceSummary/InvoiceSummary'

export const Cart = () => {
  const isOpen = useSelector(SelectCartIsOpen)
  return (
    <Container isOpen={isOpen}>
      <ClientControl />
      <ProductsList />
      <InvoiceSummary />
    </Container>
  )
}

const Container = styled.div`
  position: relative;
   background-color: ${({ theme }) => theme.bg.shade};
   max-width: 30em;
   width: 24em;
   overflow: hidden;
   display: grid;
   grid-template-rows: min-content 1fr min-content ;
   padding: 0 ;
   margin: 0;
   gap: 0.4em;
   transition: width 600ms 0ms linear;
   @media(max-width: 800px){
      height: calc(100vh);
      width: 100%;
      max-width: 100%;
      border: 1px solid rgba(0, 0, 0, 0.121);
      border-top: 0;

      border-bottom: 0;
      position: absolute;
      top: 0;
      z-index: 1000;
 
      transition: transform 600ms 0ms linear;
      
      ${props => {
    switch (props.isOpen) {
      case false:
        return `
              transform: translateX(-100%);
              position: absolute;
              z-index: 1;
            `

      default:
        break;
    }
  }}
   
   }
   
`
