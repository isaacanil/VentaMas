import React from 'react'
import styled from 'styled-components'
import { separator } from '../../../hooks/separator'

export const Bill = ({data}) => {
    return (
        <Container>
            <ITEMS text='left'>
                {data.client ? data.client.name : 'No hay cliente'}
            </ITEMS>
            <ITEMS text='left'>
                {`${new Date(data.date.seconds * 1000).toLocaleString()} `}
                {/* {new Date(data.date.seconds * 1000).toLocaleString()} */}
            </ITEMS>
            <ITEMS text='right'>
                RD$ {separator(data.totalPurchase.value)}
            </ITEMS>
            <ITEMS text={'right'}>
                RD$ {separator(data.totalTaxes.value)}
            </ITEMS>
            <ITEMS text={'right'}>
                {/* RD$ {separator(data.cashPaymentMethod.value)} */}
                {
                  data && data.cashPaymentMethod ? data.cashPaymentMethod.value : null
                }
                {
                  data && data.paymentMethod ? data.paymentMethod.find((bill) => bill.status === true).value : null
                }
            </ITEMS>
            <ITEMS text={'right'}>
                RD$ {separator(data.change.value)}
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
 border-bottom: 1px solid rgba(0, 0, 0, 0.200);
 padding: 0 1em;
 
`
const ITEMS = styled.div`
  h3{
    text-transform: uppercase;
    font-size: 0.8em;
  }
  width: 100%;
  height: 3em;
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
