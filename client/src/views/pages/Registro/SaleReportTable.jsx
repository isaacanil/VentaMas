import React from 'react'
import styled from 'styled-components'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
import { Bill } from './Bill'
import { CenteredText } from './CentredText'


export const SaleReportTable = ({data, bills, total}) => {
  return (
    <BillsContainer>
    <Layer>
      <BillsWrapper>
        <BillsHead>
            {/* {JSON.stringify(data)} */}
          {
            data ? data.table.headers.map(({ align, name}, index) => {
              return <ITEMS text={align}>
                <h3>{name}</h3>
              </ITEMS>
            }) : null
          }
       
        </BillsHead>
        <BillsBody>
          {
           bills && bills.length > 0 ? (
              bills.map(({ data }, index) => (
                <Bill data={data} key={index} />
              ))
            ) : null
          }
          {
            bills && bills.length === 0 ? (
              <CenteredText
                text='Actualmente no hay facturas registradas para el día de hoy.'
              />
            ) : null
          }
        </BillsBody>
        <PriceBox>
          <Group>
            <h3>
              {/* Total: {useFormatPrice(data.total.total)} */}
              Total: {useFormatPrice(total())}
            </h3>
            <h3>
              {/* {bills.length} Facturas */}
            </h3>
          </Group>

        </PriceBox>
      </BillsWrapper>
    </Layer>
  </BillsContainer>
  )
}

const BillsContainer = styled.div`
  width: 100%;
  height: auto;
  display: grid;
  align-items: flex-start;
  align-content: flex-start;
  justify-items: center;

`
const Layer = styled.div`
  background-color: #fff;
height: calc(100vh - 2.75em - 2.75em - 4.125em);
max-width: 1000px;
width: 100%;
margin: 1em;
position: relative;
border: 1px solid rgba(14, 14, 14, 0.100);
border-radius: 8px;
overflow: hidden;

`
const DateRangeContainer = styled.div`
  position: absolute;
  z-index: 10;
`
const BillsWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
    color: #505050;
  overflow-y: scroll;
  position: relative;
  &::after{
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 10px;
    z-index: 1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  &:last-child{
    margin-bottom: 4em;
    border-bottom: none;
  }
  /* &::before{
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(255,255,255,0) 90%, rgba(255,255,255,1) 100%);
    pointer-events: none;
    z-index: 1;
  } */
`
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  justify-content: center;
  gap: 0 1em;
 
`
const BillsHead = styled(Grid)`
  padding: 0 1em;
  position: sticky;
  top: 0;
  background-color: #eeeeee;
  color: var(--Gray9)
  
`
const ITEMS = styled.div`
  h3{
    text-transform: uppercase;
    font-size: 0.8em;
  }
  width: 100%;
  height: 2em;
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

const BillsBody = styled.div`

`
const PriceBox = styled.div`
  height: 2em;
  width: 100%;
  max-width: 1000px;
  background-color: rgb(241, 241, 241);
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

const Footer = styled(Grid)`

`
