import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { SaleReportTable } from '../../../Registro/SaleReportTable/SaleReportTable'
import { tableData } from './tableConfig'
import { useSelector } from 'react-redux'
import { selectCashCount } from '../../../../../features/cashCount/cashCountManagementSlice'
import { fbLoadInvoicesForCashCount } from '../../../../../firebase/cashCount/fbLoadInvoicesForCashCount'
import { selectUser } from '../../../../../features/auth/userSlice'
import { useNavigate } from 'react-router-dom'
import { Header } from './components/Header/Header'

export const CashupInvoicesOverview = ({ bills }) => {
    const { id } = useSelector(selectCashCount)
    const user = useSelector(selectUser)
    const [invoices, setInvoices] = useState([])
    const navigate = useNavigate()
    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                const invoicesData = await fbLoadInvoicesForCashCount(user, id, 'invoices')
                setInvoices(invoicesData)
            }
            fetchData()
        } else {
            navigate('/cash-reconciliation')
        }
    }, [id])
    const total = invoices ? () => invoices?.reduce((total, { data }) => total + data.totalPurchase.value, 0)
        : 0
    return (
        <Container>
            <Header invoices={invoices} />
            <SaleReportTable
                data={tableData}
                bills={invoices}
                total={total}
            />
        </Container>
    )
}
const Container = styled.div`
    height: 100vh;
    max-height: 100vh;
    width: 100%;
    display: grid;
    grid-template-rows: min-content 1fr;
    background-color: var(--color2);
`