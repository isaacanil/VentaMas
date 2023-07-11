import React from 'react'
import styled from 'styled-components'
import { Button } from '../../../../../../../../../templates/system/Button/Button'
import { useNavigate } from 'react-router-dom'

export const ViewInvoice = ({invoices}) => {
    const navigate = useNavigate()
    const handleRedirect = () => {
        navigate('/cash-register-invoices-overview')
    }
    return (
        <Container>
            #{invoices}
           <Button
                title={'Ver facturas'}
                borderRadius={'light'}
                bgcolor={'primary'}
                onClick={handleRedirect}
           />
        </Container>
    )
}

const Container = styled.div`
    display: flex;
    gap: 1em;
    justify-content: right;
    align-items: center;
`