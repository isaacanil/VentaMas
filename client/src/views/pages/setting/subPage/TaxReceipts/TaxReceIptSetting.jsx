import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useMatch } from 'react-router-dom'
import styled from 'styled-components'
import { getTaxReceiptData, IncreaseEndConsumer,  } from '../../../../../features/taxReceipt/taxReceiptSlice'
import { ChangeProductData } from '../../../../../features/updateProduct/updateProductSlice'
import { updateTaxReceiptDataBD, readTaxReceiptDataBD, createTaxReceiptDataBD, deleteTaxReceiptDataBD } from '../../../../../firebase/firebaseconfig'
import { useCompareArrays } from '../../../../../hooks/useCompareArrays'
import { Button, MenuApp } from '../../../../index'
import { TableTaxReceipt } from './TableTaxReceipt'

export const TaxReceiptSetting = () => {
  const dispatch = useDispatch()
  const [taxReceiptData, setTaxReceiptData] = useState([])
  const [taxReceipt, setTaxReceipt] = useState([
    {
      name: 'CONSUMIDOR FINAL',
      type: 'B',
      serie: '01',
      sequence: '0000000001',
      increase: '1',
      quantity: '2000'
    },
    {
      name: 'CONSUMIDOR FISCAL',
      type: 'B',
      serie: '02',
      sequence: '0000000001',
      increase: '1',
      quantity: '2000'
    }
  ])

  console.log(taxReceipt)
  useEffect(() => {
    readTaxReceiptDataBD(setTaxReceiptData)
  }, [])
  useEffect(() => {
    if (taxReceiptData !== undefined && taxReceiptData.length > 0) {
      dispatch(getTaxReceiptData(taxReceiptData))
      setTaxReceipt(taxReceiptData)
      dispatch(IncreaseEndConsumer())
    }
  }, [taxReceiptData])
  console.log(taxReceiptData, 'taxReceiptData')
  const handleSubmit = (e) => {
    e.preventDefault()
    updateTaxReceiptDataBD(taxReceipt)
    //createCounter()
    //deleteCounter()
  }
  const arrayAreEqual = useCompareArrays(taxReceiptData, taxReceipt)

  console.log(arrayAreEqual, 'arratAreEqual...........................')
  return (
    <Container>
      <MenuApp></MenuApp>
      <Main>
        <Head>
          <h4>CONFIGURACION DE COMPROBANTES</h4>
        </Head>
        <Body>
          <TableTaxReceipt data={taxReceipt} setData={setTaxReceipt}></TableTaxReceipt>
        </Body>
        <Footer>
          <Button
            title='actualizar'
            borderRadius={'normal'}
            onClick={handleSubmit}
            bgcolor={'primary'}
            disabled={arrayAreEqual ? true : false}
          />
        </Footer>
      </Main>

    </Container>
  )
}
const Container = styled.div`
  
`
const Footer = styled.div``
const Head = styled.div`
  height: 2.4em;
  width: 100%;
  background-color: #dddddd;
  display: flex;
  border-radius: var(--border-radius1);
  align-items: center;

`
const Body = styled.div`

`
const Main = styled.div`
  display: grid;
  gap: 1em;
  margin: 0 auto;
  width: 1000px;
  padding: 1em 0;
  h4{
    padding: 0 1em;
  }
`