import React, { useState } from 'react'
import { MenuApp, InputText } from '../../'
import styled from 'styled-components'
import { getBills } from '../../../firebase/firebaseconfig.js'
import { useEffect } from 'react'
import { separator } from '../../../hooks/separator'

export const Registro = () => {

  const [bills, setBills] = useState([])
  const [client, setClient] = useState('')
 
  useEffect(() => {
    getBills(setBills, setClient)
  }, [])

    console.log(client)
  


  
  
   

  return (
    <div>
      <MenuApp></MenuApp>
      <FilterBar></FilterBar>
      <BillsContainer>
        <BillsHead>
          <ITEMS>
            <h3>Clientes</h3>
          </ITEMS>
          <ITEMS>
            <h3>Fecha</h3>
          </ITEMS>
          <ITEMS>
            <h3>TOTAL</h3>
          </ITEMS>
          <ITEMS>
            <h3>ITBIS</h3>
          </ITEMS>
          <ITEMS>
            <h3>Pago con</h3>
          </ITEMS>
          <ITEMS>
            <h3>Cambio</h3>
          </ITEMS>
          
        </BillsHead>
        <BillsBody>
          {
            bills.length > 0 ? (
              bills.map(({ data }, index) => (
                <Bills key={index}>
                  <ITEMS>
                    {client !== '' ? 'generic client' : null}
                  </ITEMS>
                  <ITEMS>
                    {new Date(data.date.seconds * 1000).toLocaleString()}
                  </ITEMS>
                  <ITEMS>
                    RD${separator(data.totalPurchase.value)}
                  </ITEMS>
                  <ITEMS>
                    {data.totalTaxes.value}
                  </ITEMS>
                  <ITEMS>
                    RD$ {data.cashPaymentMethod.value}
                  </ITEMS>
                  <ITEMS>
                    RD$ {separator(data.change.value)}
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

        </BillsBody>
       
      </BillsContainer>








    </div>
  )
}
const FilterBar = styled.div`
  
`
const BillsContainer = styled.div`
`
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  justify-content: center;
  gap: 0 1em;
 
`
const BillsHead = styled(Grid)`

`
const ITEMS = styled.div`
  width: 100%;
  text-align: center;
`
const Bills = styled(Grid)`
 
 
`
const BillsBody = styled.div`

`
const Footer = styled(Grid)`

`


