import React, { useState } from 'react'
import { MenuApp, InputText } from '../../'
import styled from 'styled-components'
import { getItems } from '../../../firebase/firebaseconfig'
import { useEffect } from 'react'
import { separator } from '../../../hooks/separator'

export const Registro = () => {
  const [bills, setBills] = useState('')
  const path = 'bills'
 
  useEffect(() => {
    getItems(setBills, path)
  }, [])
  console.log(bills)
  return (
    <div>
      <MenuApp></MenuApp>
      <Facturas>
        <Head>
          <ITEMS>
            <h3>Fecha</h3>
          </ITEMS>
          
          <ITEMS>
            <h3>Clientes</h3>
          </ITEMS>
          <ITEMS>
            <h3>Pagado</h3>
          </ITEMS>
          <ITEMS>
            <h3>Cambio</h3>
          </ITEMS>
          <ITEMS>
            <h3>TOTAL</h3>
          </ITEMS>
        </Head>
        <Body>
          {
            bills.length > 0 ? (
              bills.map(({data}, index) => (
                <Bills key={index}>
                  <ITEMS>
                
                    {new Date(data.date.seconds * 1000).toLocaleString()}
              
                  </ITEMS>
                 
                  <ITEMS>
                      {`${data.client.name}`}
                  </ITEMS>
                  <ITEMS>
                     RD$ {data.cashPaymentMethod.value}
                  </ITEMS>
                  <ITEMS>
                     RD$ {separator(data.change.value)}
                  </ITEMS>
                  <ITEMS>
                      RD${separator(data.totalPurchase.value)}
                  </ITEMS>
                </Bills>
              ))
            ) : null
            
          }
          <ITEMS></ITEMS>
          <ITEMS></ITEMS>
          <ITEMS></ITEMS>
          <ITEMS></ITEMS>
          <ITEMS></ITEMS>

        </Body>
        <Footer>
          <ITEMS>TOTAL</ITEMS>
          <ITEMS></ITEMS>
          <ITEMS></ITEMS>
          <ITEMS></ITEMS>
          <ITEMS></ITEMS>
        </Footer>

      </Facturas>








    </div>
  )
}
const Facturas = styled.div`
  
`
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  justify-content: center;
  justify-items: center;
 
`
const Head = styled(Grid)`

`
const ITEMS = styled.div`

`
const Bills = styled(Grid)`
  
`
const Body = styled.div`

`
const Footer = styled(Grid)`

`


