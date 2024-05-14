import React from 'react'
import styled from 'styled-components'
import { ChargedSection } from './components/ChargedSection/ChargedSection'
import { PaymentMethods } from './components/PaymentMethods/PaymentMethods'
import { PaymentSummary } from './components/PaymentSummary/PaymentSummary'
import { PrintControl } from './components/PrintControl/PrintControl'
import { MarkAsReceivableButton } from './components/MarkAsReceivableButton/MarkAsReceivableButton'
import { ReceivableManagementPanel } from './components/ReceivableManagementPanel/ReceivableManagementPanel'

export const Body = ({form}) => {
    return (
        <Container>
            <ChargedSection />
            <PaymentMethods />
            <PaymentSummary   />
            <MarkAsReceivableButton />
            <ReceivableManagementPanel form={form} />
            <PrintControl />
        </Container>
    )
}

const Container = styled.div`
        display: grid;
        gap: 1.4em;
    `