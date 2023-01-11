import React, { Fragment, useState } from 'react'
import { MenuApp, InputText } from '../../'
import styled from 'styled-components'
import { getBills } from '../../../firebase/firebaseconfig.js'
import { useEffect } from 'react'
import { separator } from '../../../hooks/separator'
import { DatePicker } from '../../templates/system/DatePicker/DatePicker'
import { correctDate } from '../../../hooks/correctDate'
import { SelectCategory } from '../../templates/system/Select/SelectCategory'
import { Bill } from './Bill'
export const Registro = () => {
  const [bills, setBills] = useState([])
  const [client, setClient] = useState('')
  const [datesSelected, setDatesSelected] = useState({})
  useEffect(() => {
    getBills(setBills, datesSelected)
  }, [datesSelected])
  console.log(datesSelected)
  const totalPurchases = () =>{
    const r = bills.reduce((total, {data}) => total + data.totalPurchase.value, 0)
    return r
  }
  console.log(bills)
  return (
    <Fragment>
      <Container>
        <MenuApp></MenuApp>
        <FilterBar>
          <span>
            <DatePicker dates={setDatesSelected}></DatePicker>
            <SelectCategory />
          </span>
        </FilterBar>
        <BillsContainer>
          <Layer>
            <BillsWrapper>
              <BillsHead>
                <ITEMS text='left'>
                  <h3>Clientes</h3>
                </ITEMS>
                <ITEMS text='left'>
                  <h3>Fecha</h3>
                </ITEMS>
                <ITEMS text='right'>
                  <h3>TOTAL</h3>
                </ITEMS>
                <ITEMS text='right'>
                  <h3>ITBIS</h3>
                </ITEMS>
                <ITEMS text='right'>
                  <h3>Pago con</h3>
                </ITEMS>
                <ITEMS text='right'>
                  <h3>Cambio</h3>
                </ITEMS>
              </BillsHead>
              <BillsBody>
                {
                  bills.length > 0 ? (
                    bills.map(({ data }, index) => (
                     <Bill data={data} key={index} />
                    ))
                  ) : null

                }
              </BillsBody>
            </BillsWrapper>
          </Layer>
              <PriceBox>
                <h3>
                 Total : RD$ {separator(totalPurchases())}

                </h3>

              </PriceBox>
        </BillsContainer>
      </Container>
    </Fragment>
  )
}
const Container = styled.div`
  max-height: calc(100vh);
  height: 100vh;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  gap: 1em;
  box-sizing: border-box;
 
`
const FilterBar = styled.div`
  width: 100%;
  display: flex;
  justify-items: center;
  span{
    max-width: 1000px;
    width: 100%;
    display: flex;
    align-items: end;
    padding: 0.4em 1em;
    margin: 0 auto;
    z-index: 2;
    gap: 1em;
  }
  select{
    padding: 0.1em 0.2em;
  }
 
`

const BillsContainer = styled.div`
  width: 100%;
  height: auto;
  //background-color: red;
  display: grid;

  justify-items: center;

`
const Layer = styled.div`
  background-color: #fff;
height: calc(100vh - 2.75em - 2.75em - 13em);
max-width: 1000px;
width: 100%;
margin: 1em;
position: relative;
border: 1px solid black;
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
  background-color: #e6e6e6;
  
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

const BillsBody = styled.div`

`
const PriceBox = styled.div`
  height: 2.75em;
  width: 100%;
  max-width: 1000px;
  background-color: #d4d4d4;
  border-radius: 10em;
  padding: 0 1em;
  display: flex;
  align-items: center;
  h3{
    font-weight: 500;
    font-size: 1.2em;
    margin: 0;
  }

 

`

const Footer = styled(Grid)`

`


