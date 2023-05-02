import React, { Fragment, useState } from 'react'
import { MenuApp, InputText, Button, ButtonGroup } from '../../'
import styled from 'styled-components'
import { getBills } from '../../../firebase/firebaseconfig.jsx'
import { useEffect } from 'react'
import { DatePicker } from '../../templates/system/DatePicker/DatePicker'
import { Bill } from './Bill'
import { SiMicrosoftexcel } from 'react-icons/si'
import useExcelExport from '../../../hooks/exportToExcel/useExportToExcel'
import exportToExcel from '../../../hooks/exportToExcel/useExportToExcel'
import { formatBill } from '../../../hooks/exportToExcel/formatBill'
import { useFormatPrice } from '../../../hooks/useFormatPrice'
import Clock from '../../../hooks/time/Clock'
import { CenteredText } from '../../templates/system/CentredText'
import TimeFilterButton from '../../templates/system/Button/TimeFilterButton/TimeFilterButton'
import { tableData } from './tableData'
import { SaleReportTable } from './SaleReportTable/SaleReportTable'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExcel } from '@fortawesome/free-solid-svg-icons'
import { ComponentTagger } from '../../templates/system/ComponentTagger/ComponentTagger'
import { useDispatch } from 'react-redux'
import { addNotification } from '../../../features/notification/NotificationSlice'

export const Registro = () => {
  const [bills, setBills] = useState([])
  const [client, setClient] = useState('')
  const [datesSelected, setDatesSelected] = useState({})
  const dispatch = useDispatch()
  useEffect(() => {
    getBills(setBills, datesSelected)
  }, [datesSelected])

  const total = () => bills.reduce((total, { data }) => total + data.totalPurchase.value, 0)

  const transformedResumenBillsData = () => bills.map((bill) => {
    return formatBill({ data: bill.data, type: 'Resumen' });
  });

  const transformedDetailedBillsData = () => {
    return formatBill({ data: bills, type: 'Detailed' });
  };


  const handleExportButton = (type) => {
    if (bills.length === 0) {
      dispatch(addNotification({ title: 'Error al exportar', message: 'No hay Facturas para exportar', type: 'error' }))
      return
    }
    switch (type) {
      case 'Resumen':
        console.log('----------------------------', transformedResumenBillsData())
        exportToExcel(transformedResumenBillsData(), 'Registros', 'Registro.xlsx');
        break;
      case 'Detailed':
        console.log('----------------------------', transformedDetailedBillsData())
        exportToExcel(transformedDetailedBillsData(), 'Registros', 'Registro.xlsx');
        break;
      default:
        break;
    }
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
            <DatePicker dates={setDatesSelected} data={datesSelected} />
            <TimeFilterButton onTimeFilterSelected={handleTimeChange} />
            <ComponentTagger text={'Exportar excel:'} children={
              <ButtonGroup>
                <Button
                  bgcolor={'gray'}
                  title={'Resumen'}
                  borderRadius='normal'
                  onClick={() => handleExportButton('Resumen')}
                  startIcon={<SiMicrosoftexcel />}
                />
                <Button
                  bgcolor={'gray'}
                  title={'Detalle'}
                  borderRadius='normal'
                  onClick={() => handleExportButton('Detailed')}
                  startIcon={<SiMicrosoftexcel />}
                />
              </ButtonGroup>
            } />
          </span>
        </FilterBar>
        <SaleReportTable
          data={tableData}
          bills={bills}
          total={total}
        />
      </Container>
    </Fragment>
  )
}
const Container = styled.div`
  max-height: calc(100vh);
  height: 100vh;
  overflow: hidden;
  display: grid;
  background-color: var(--color2);
  grid-template-rows: min-content min-content 1fr;
  box-sizing: border-box;
`
const FilterBar = styled.div`
  width: 100%;
  display: flex;
  justify-items: center;
  background-color: var(--White);
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





