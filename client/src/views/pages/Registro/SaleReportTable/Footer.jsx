import React from 'react'
import styled from 'styled-components'
import { useFormatPrice } from '../../../../hooks/useFormatPrice'

export const Footer = ({total, bills}) => {
  const handleTotal = () => {
    if(typeof total === 'function'){
      return total()
    }
    if(typeof total === 'string' || typeof total === 'number'){
      return total
    }
  }
  return (
    <Container>
         <PriceBox>
          <Group>
            <h3>
              Total: {useFormatPrice(handleTotal())}
            </h3>
            <h3>
              {bills.length} Facturas
            </h3>
          </Group>
        </PriceBox>
    </Container>
  )
}
const Container = styled.div`

`
const PriceBox = styled.div`
  height: 2.8em;
  width: 100%;
  max-width: 1000px;
  background-color: rgb(255, 255, 255);
  padding: 0 1em;
  position: sticky;
  bottom: 0;
  border-top: 1px solid rgba(14, 14, 14, 0.100);

  display: flex;
  align-items: center;
  justify-content: space-between;

`
const Group = styled.div`
  display: flex;
  gap: 2.5em;
  align-items: center;
  h3{
    font-weight: 500;
    font-size: 1.1em;
      line-height: 1.5em;
    margin: 0;
  }
 
`
