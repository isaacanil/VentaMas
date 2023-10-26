import React, { useState } from 'react'
import { MenuApp } from '../..'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import Typography from '../../templates/system/Typografy/Typografy'
import { useFbGetExpenses } from '../../../firebase/expenses/Items/useFbGetExpenses'
import { useFbGetPurchase } from '../../../firebase/purchase/fbGetPurchase'
import { getDateRange } from '../../../utils/date/getDateRange'
import { DatePicker } from '../../templates/system/Dates/DatePicker/DatePicker'
import { fbGetInvoices } from '../../../firebase/invoices/fbGetInvoices'

import { DateTime } from 'luxon'
import DailySalesWithAverageChart from './charts/DailySalesWithAverageChart/DailySalesWithAverageChart'
import WeeklySalesWithAverageChart from './charts/WeeklySalesWithAverageChart/WeeklySalesWithAverageChart'
import BiWeeklySalesWithAverageChart from './charts/BiWeeklySalesWithAverageChart/BiWeeklySalesWithAverageChart'
import GeneralAndMonthlySales from './charts/GeneralAndMonthlySales/GeneralAndMonthlySales'
import { MonthlyFinancialReportChart } from './charts/MonthlyFinancialReportChart/MonthlyFinancialReportChart'

export const Utility = ({ isOpen = true }) => {
    const [datesSelected, setDatesSelected] = useState(getDateRange('thisMonth'));
    const { expenses } = useFbGetExpenses(datesSelected);
    const { invoices } = fbGetInvoices(datesSelected);
    console.log(invoices, expenses);
    const variantsBackdrop = {
        open: { opacity: 1, zIndex: 1 },
        close: { opacity: 0, zIndex: -1 },
    }
    const variantsContainer = {
        open: {
            opacity: 1,
            y: 0,
        },
        close: {
            opacity: 0,
            y: '100vh',
        }
    }
 
    return (
        <Container>
            <MenuApp 
                sectionName={'Utilidad'}
            />
                <Component
                    // ref={componentRef}
                    variants={variantsContainer}
                    initial="close"
                    animate={isOpen ? "open" : "close"}
                    transition={{ duration: 0.5 }}
                    exit="close"
                    >
                    <Header>
                        <Typography variant='h2'>
                            Utilidad
                        </Typography>
                        {/* <Button
                                    title='Cerrar'
                                    onClick={handleOpenExpensesChart}
                                /> */}
                    </Header>
                    <Toolbar>
                        <DatePicker
                            dates={datesSelected}
                            setDates={setDatesSelected}
                            dateOptionsMenu
                            datesDefault='thisMonth'
                        />
                    </Toolbar>
                    <Body>
                        <DailySalesWithAverageChart
                            invoices={invoices}
                            
                        />
                        <WeeklySalesWithAverageChart  
                            invoices={invoices}
                        />
                        <BiWeeklySalesWithAverageChart 
                            invoices={invoices}
                        />
                        <GeneralAndMonthlySales
                            invoices={invoices}
                        />
                        <MonthlyFinancialReportChart 
                            expenses={expenses}
                            invoices={invoices}
                        />
                    </Body>
                </Component>
        </Container>
    )
}
const Container = styled.div`
height: 100vh;
    display: grid;
    overflow: hidden;
    grid-template-rows: min-content 1fr;
`
const ReportContainer = styled.div`
  
`

const Component = styled(motion.div)`
  width: 98vw;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 1em;
  margin: 0 auto;
  height: 100%;
  background-color: #ffffff;
  border: 1px solid #1d1d1d37;
  border-radius: 0.5em;
  overflow-y: scroll;
  padding: 0 1em;
 
  `;
const Toolbar = styled.div`
    position: sticky;
    top: 0;
    padding: 0.5em 0;
    background-color: white;
    border-bottom: 1px solid #1d1d1d37;
`


const Header = styled.div`
  display: grid;
  align-items: center;
  position: sticky;
  top: 0;
  padding: 1em 1em 0 ;
  background: white;
  gap: 1em;
  `
const Body = styled.div`
    display: grid;
    align-content: start;   
    gap: 4em;
  `