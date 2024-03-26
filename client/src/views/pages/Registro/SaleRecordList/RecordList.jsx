import React from 'react'
import styled from 'styled-components'
import { InvoiceItem } from './InvoiceItem'
export const SaleRecordList = ({invoices}) => {
  console.log(invoices)
  return (
    <Container>
      {
        invoices.map((invoice)=>(
          <div>
            <InvoiceItem data={invoice} />
          </div>
        ))
      }
    </Container>
  )
}
const Container = styled.div`
  height: 100%;
  width: 100%;
  background-color: red;
`
const InvoiceContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #e6e6e6;
  border-radius: 5px;
  margin: 10px 0;
`