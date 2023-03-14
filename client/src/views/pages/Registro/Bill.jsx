import React from 'react'
import styled from 'styled-components'
import { separator } from '../../../hooks/separator'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
import { getTimeElapsed } from '../../../hooks/useFormatTime'

export const Bill = ({ data }) => {
  const totalTax = data.products.reduce((total, product) => total + (product.tax.value * product.cost.unit) * product.amountToBuy.total, 0)
  return (
    <Container>
      <ITEMS text='left'>
        {data.client ? data.client.name : 'No hay cliente'}
      </ITEMS>
      <ITEMS text='left'>
        {/* {`${new Date(data.date.seconds * 1000).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          } `} */}
          
        {getTimeElapsed(data.date.seconds * 1000)}
      </ITEMS>
      <ITEMS text='right'>
        {useFormatPrice(data.totalPurchase.value)}
      </ITEMS>
      <ITEMS text={'right'}>
        {useFormatPrice(totalTax)}
      </ITEMS>
      <ITEMS text={'right'}>
        {/* RD$ {useFormatPrice(data.cashPaymentMethod.value)} */}
        {
          data && data.cashPaymentMethod ? useFormatPrice(data.cashPaymentMethod.value) : null
        }
        {
          data && data.paymentMethod ? useFormatPrice(data.paymentMethod.find((bill) => bill.status === true).value) : null
        }
      </ITEMS>
      <ITEMS text={'right'}>
        {useFormatPrice(data.change.value)}
      </ITEMS>
    </Container>
  )
}
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  justify-content: center;
  gap: 0 1em;
 
`
const Container = styled(Grid)`
 background-color: white;
 border-bottom: 1px solid rgba(0, 0, 0, 0.100);
 padding: 0 1em;
 
`
const ITEMS = styled.div`
  h3{
    text-transform: uppercase;
    font-size: 0.8em;
  }
  width: 100%;
  height: 3.2em;
  display: grid;
  text-align: center;
  align-items: center;
  ${(props) => {
    switch (props.text) {
      case 'right':
        return `
          text-align: right;
        `
      case 'left':
        return `
          text-align: left;
          `
      default:
        break;
    }
  }}
`
