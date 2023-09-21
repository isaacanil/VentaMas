import React, { Fragment, useState } from 'react'
import { MenuApp, Button, ButtonGroup } from '../../'
import styled from 'styled-components'
import { DatePicker } from '../../templates/system/DatePicker/DatePicker'
import TimeFilterButton from '../../templates/system/Button/TimeFilterButton/TimeFilterButton'
import { tableData } from './tableData'
import { SaleReportTable } from './SaleReportTable/SaleReportTable'

import { ComponentTagger } from '../../templates/system/ComponentTagger/ComponentTagger'
import { useDispatch, useSelector } from 'react-redux'
import { addNotification } from '../../../features/notification/NotificationSlice'
import { fbGetInvoices } from '../../../firebase/invoices/fbGetInvoices'
import { motion } from 'framer-motion'
import { selectUser } from '../../../features/auth/userSlice'




export const Registro = () => {
  const dispatch = useDispatch()

  const [datesSelected, setDatesSelected] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const { invoices } = fbGetInvoices(datesSelected)
  const user = useSelector(selectUser);

  const handleTimeChange = (start, end) => {
    setDatesSelected({ startDate: start.toMillis(), endDate: end.toMillis() })
  }

  return (
    <Fragment>
      <Container
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 0 }}
      >
        <MenuApp
         
          data={invoices}
          searchData={searchTerm}
          setSearchData={setSearchTerm}
        />
        <FilterBar>
          <span>
            <DatePicker setDates={setDatesSelected} dates={datesSelected} />
            <TimeFilterButton onTimeFilterSelected={handleTimeChange} />
            {/* <ComponentTagger text={'Exportar excel:'} children={ */}

            {/* } /> */}
          </span>
        </FilterBar>
        <SaleReportTable
          bills={invoices}
          searchTerm={searchTerm}
        />
      </Container>
    </Fragment>
  )
}
const Container = styled(motion.div)`
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





