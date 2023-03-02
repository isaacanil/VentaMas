import React, { Fragment, useState } from 'react'
import { MenuApp, InputText, Button } from '../../'
import styled from 'styled-components'
import { getBills } from '../../../firebase/firebaseconfig.jsx'
import { useEffect } from 'react'
import { separator } from '../../../hooks/separator'
import { DatePicker } from '../../templates/system/DatePicker/DatePicker'
import { correctDate } from '../../../hooks/correctDate'
import { SelectCategory } from '../../templates/system/Select/SelectCategory'
import { Bill } from './Bill'
import { SiMicrosoftexcel } from 'react-icons/si'
import useExcelExport from '../../../hooks/exportToExcel/useExportToExcel'
import exportToExcel from '../../../hooks/exportToExcel/useExportToExcel'
import formatBill from '../../../hooks/exportToExcel/formatBill'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
import Clock from '../../../hooks/Clock'
export const Registro = () => {
  const [bills, setBills] = useState([])
  const [client, setClient] = useState('')
  const [datesSelected, setDatesSelected] = useState({})

  useEffect(() => {
    getBills(setBills, datesSelected)
  }, [datesSelected])
  console.log(datesSelected)
  const totalPurchases = () => {
    const r = bills.reduce((total, { data }) => total + data.totalPurchase.value, 0)
    return r
  }
  const transformedData = bills.map((bill) => {
    return formatBill(bill.data);
  });
  const handleExportButtonClick = () => {
    exportToExcel(transformedData, 'Registros', 'Registro.xlsx');
  };


  console.log(bills)
  return (
    <Fragment>
      <Container>
        <MenuApp></MenuApp>
        <FilterBar>
          <span>
            <DatePicker dates={setDatesSelected}></DatePicker>
            <Button
              title={'export'}
              borderRadius='normal'
              bgcolor={'success'}
              onClick={() => handleExportButtonClick()}
              startIcon={<SiMicrosoftexcel />}
            />
            {/* <SelectCategory /> */}
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
              <PriceBox>
                <Group>
                  <h3>
                    Total: {useFormatPrice(totalPurchases())}
                  </h3>
                  <h3>
                    {bills.length} Facturas
                  </h3>
                </Group>
                <Group>
                  <h3>
                    {new Date().toLocaleDateString('es-US')}
                  </h3>
                  <h3>
                    <Clock />
                  </h3>
                </Group>
              </PriceBox>
            </BillsWrapper>
          </Layer>
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
  background-color: #ffffff;
  grid-template-rows: min-content min-content 1fr;
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


