import React from 'react'
import styled from 'styled-components'
import { separator } from '../../../hooks/separator'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
import { getTimeElapsed } from '../../../hooks/useFormatTime'
import { Button } from '../../templates/system/Button/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faReceipt } from '@fortawesome/free-solid-svg-icons'
import { Row } from '../../templates/system/Table/Row'
import { ColData } from './ColumnsData'
import useScroll from '../../../hooks/useScroll'
import { FormattedValue } from '../../templates/system/FormattedValue/FormattedValue'

export const Bill = ({ data }) => {
  const totalTax = data?.products?.reduce((total, product) => total + (product?.tax?.value * product?.cost?.unit) * product?.amountToBuy?.total, 0)

  return (
    <Container>
      <Row col={ColData}>
      <ITEMS text='left'>
          <FormattedValue
            type='number'
            transformValue={false}
            value={
              data.NCF || 'Error'
            } />
        </ITEMS>
        <ITEMS text='left'>
          {data?.client?.name || 'No hay cliente'}
        </ITEMS>
        <ITEMS text='left'>
          <FormattedValue
            type='number'
            transformValue={false}
            value={
              getTimeElapsed(data?.date?.seconds * 1000)
            } />
        </ITEMS>
       
        <ITEMS text={'right'}>
        <FormattedValue
            type='price'
            value={totalTax}
          />
        </ITEMS>
        <ITEMS text={'right'}>
        <FormattedValue
            type='price'
            value={
              data?.cashPaymentMethod?.value || data?.paymentMethod?.find((bill) => bill.status === true).value
            }
          />
        </ITEMS>
        <ITEMS text={'right'}>
        <FormattedValue
            type='price'
            value={
              data?.change?.value
            }
          />
        </ITEMS>
        <ITEMS text='right'>
          <FormattedValue
            type='price'
            value={data?.totalPurchase?.value}
          />
        </ITEMS>
        {/* <ITEMS align={'right'}>
          <Button
            width='icon32'
            color='gray-dark'
            variant='container'
            borderRadius='light'
            title={
              <FontAwesomeIcon icon={faReceipt} />
            }
          />
        </ITEMS> */}
      </Row>

    </Container>
  )
}



const Container = styled.div`
 background-color: white;
 border-bottom: 1px solid rgba(0, 0, 0, 0.100);
 padding: 0;
 :last-child{
    border-bottom: none;
 }
 
`
const ITEMS = styled.div`
  h3{
    text-transform: uppercase;
    font-size: 0.8em;
  }
  width: 100%;
  height: 3.5em;
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
   ${(props) => {
    switch (props.align) {
      case 'right':
        return `
        display: flex;
        justify-content: flex-end;
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
