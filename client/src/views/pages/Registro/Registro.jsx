import React, { Fragment, useState } from 'react'
import { MenuApp, InputText, Button } from '../../'
import styled from 'styled-components'
import { getBills } from '../../../firebase/firebaseconfig.jsx'
import { useEffect } from 'react'
import { DatePicker } from '../../templates/system/DatePicker/DatePicker'
import { Bill } from './Bill'
import { SiMicrosoftexcel } from 'react-icons/si'
import useExcelExport from '../../../hooks/exportToExcel/useExportToExcel'
import exportToExcel from '../../../hooks/exportToExcel/useExportToExcel'
import formatBill from '../../../hooks/exportToExcel/formatBill'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
import Clock from '../../../hooks/Clock'
import { CenteredText } from './CentredText'
import TimeFilterButton from '../../templates/system/Button/TimeFilterButton/TimeFilterButton'
import { salesReportData } from './sales_register_data'
import { SaleReportTable } from './SaleReportTable'
export const Registro = () => {
  const [bills, setBills] = useState([])
  const [client, setClient] = useState('')
  const [datesSelected, setDatesSelected] = useState({})
 const data = salesReportData
  useEffect(() => {
    getBills(setBills, datesSelected)
  }, [datesSelected])
  console.log(datesSelected)
  const total = () => bills.reduce((total, { data }) => total + data.totalPurchase.value, 0)
    
  

  const transformedData = bills.map((bill) => {
    return formatBill(bill.data);
  });
  const handleExportButtonClick = () => {
    exportToExcel(transformedData, 'Registros', 'Registro.xlsx');
  };
  const handleTimeChange = (start, end) => {
    setDatesSelected({ startDate: start.toMillis(), endDate: end.toMillis() })
  }

  console.log(bills)
  return (
    <Fragment>
      <Container>
        <MenuApp></MenuApp>
        <FilterBar>
          <span>
            <DatePicker dates={setDatesSelected} data={datesSelected}></DatePicker>
            <TimeFilterButton onTimeFilterSelected={handleTimeChange} />
            <Button
              title={'export'}
              borderRadius='normal'
              onClick={() => handleExportButtonClick()}
              startIcon={<SiMicrosoftexcel />}
            />
            {/* <SelectCategory /> */}
          </span>
        </FilterBar>
        <SaleReportTable data={data} bills={bills} total={total}/>
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





