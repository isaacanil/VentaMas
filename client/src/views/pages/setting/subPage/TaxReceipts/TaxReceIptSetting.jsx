import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMatch } from 'react-router-dom'
import styled from 'styled-components'
import { getTaxReceiptData, IncreaseEndConsumer, } from '../../../../../features/taxReceipt/taxReceiptSlice'
import { ChangeProductData } from '../../../../../features/updateProduct/updateProductSlice'
import { useCompareArrays } from '../../../../../hooks/useCompareArrays'
import { Button, MenuApp } from '../../../../index'
import { TableTaxReceipt } from './TableTaxReceipt'
import { fbGetTaxReceipt } from '../../../../../firebase/taxReceipt/fbGetTaxReceipt'
import { fbUpdateTaxReceipt } from '../../../../../firebase/taxReceipt/fbUpdateTaxReceipt'
import { selectUser } from '../../../../../features/auth/userSlice'

export const TaxReceiptSetting = () => {
  const dispatch = useDispatch()
  const [taxReceiptLocal, setTaxReceiptLocal] = useState([])
  const user = useSelector(selectUser)
  const { taxReceipt } = fbGetTaxReceipt()
  console.log(taxReceipt)

  useEffect(() => {
    dispatch(getTaxReceiptData(taxReceipt))
    setTaxReceiptLocal(taxReceipt)
   // dispatch(IncreaseEndConsumer())
  }, [taxReceipt])

  // console.log(taxReceiptData, 'taxReceiptData')
  const handleSubmit = (e) => {
    e.preventDefault()
    fbUpdateTaxReceipt(taxReceiptLocal, user)
  }
  // const arrayAreEqual = useCompareArrays(taxReceiptData, taxReceipt)

  // console.log(arrayAreEqual, 'arratAreEqual...........................')
  return (
    <Container>
      <MenuApp></MenuApp>
      <Main>
        <Head>
          <h4>CONFIGURACION DE COMPROBANTES</h4>
        </Head>
        <Body>
          <TableTaxReceipt array={taxReceiptLocal} setData={setTaxReceiptLocal}></TableTaxReceipt>
        </Body>
        <Footer>
          <Button
            title='actualizar'
            borderRadius={'normal'}
            onClick={handleSubmit}
            bgcolor={'primary'}
          //  disabled={arrayAreEqual ? true : false}
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
  max-width: 800px;
  width: 100%;
  padding: 1em;
  h4{
    padding: 0 1em;
  }
`