import React from 'react'
import styled from 'styled-components'
import { Button } from '../../../../../../../../../templates/system/Button/Button'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '../../../../../../../../../templates/system/Skeleton/Skeleton'

export const ViewInvoice = ({invoices, loading}) => {
    const navigate = useNavigate()
    const handleRedirect = () => {
        navigate('/cash-register-invoices-overview')
    }
    return (
        <Skeleton loading={loading}>

        <Container>
            #{invoices}
           <Button
                title={'Ver facturas'}
                borderRadius={'light'}
                bgcolor={'primary'}
                onClick={handleRedirect}
           />
        </Container>
        </Skeleton>
    )
}

const Container = styled.div`
    display: flex;
    gap: 1em;
    justify-content: right;
    align-items: center;
`