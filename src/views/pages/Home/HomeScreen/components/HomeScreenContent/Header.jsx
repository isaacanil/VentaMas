import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import { getBills } from '../../../../../../firebase/firebaseconfig'
import { getSalesForCurrentDay } from '../../../../../../hooks/GetDailySales';
// Obtener la fecha y hora actual
const today = DateTime.local();

// Obtener la fecha de ayer a la primera hora
const startDate = today.minus({ days: 1 }).startOf('day').toMillis();

// Obtener la fecha de hoy a la última hora
const endDate = today.endOf('day').toMillis();
export const Header = () => {
    const [bills, setBills] = useState([])
    const [date, setDate] = useState({startDate: startDate, endDate: endDate})
    useEffect(() => {
        getBills(setBills, date)
    }, [])
    const {salesForCurrentDay, growthPercentage} = getSalesForCurrentDay(bills)
    const saleQuantity = bills.length
  return (
    <Container>
        {/* {useFormatPrice(salesForCurrentDay)} */}
        {saleQuantity}
        {' salesforCurrent==>'+ salesForCurrentDay}
        {'griw ==> '+growthPercentage}
        {JSON.stringify(bills)}
        {/* <CardWithPercent title={} icon={} number={getDailySales().dailySalesTotal}/> */}
    </Container>
  )
}
const Container = styled.div`

`