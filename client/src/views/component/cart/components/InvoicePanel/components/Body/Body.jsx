import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { ChargedSection } from './components/ChargedSection/ChargedSection'
import { PaymentMethods } from './components/PaymentMethods/PaymentMethods'
import { PaymentSummary } from './components/PaymentSummary/PaymentSummary'
import { PrintControl } from './components/PrintControl/PrintControl'
import { MarkAsReceivableButton } from './components/MarkAsReceivableButton/MarkAsReceivableButton'
import { ReceivableManagementPanel } from './components/ReceivableManagementPanel/ReceivableManagementPanel'
import { fbGetCreditLimit } from '../../../../../../../firebase/accountsReceivable/fbGetCreditLimit'
import { selectUser } from '../../../../../../../features/auth/userSlice'
import { useSelector } from 'react-redux'
import { selectClient } from '../../../../../../../features/clientCart/clientCartSlice'
import { useQuery } from '@tanstack/react-query'
0
export const Body = ({ form }) => {
    const user = useSelector(selectUser);
    const client = useSelector(selectClient);
    const clientId = client.id;

    

    const { data: creditLimit, error, isLoading } = useQuery({
        queryKey: ['creditLimit', user, clientId],
        queryFn: () => fbGetCreditLimit({ user, clientId }),
        enabled: !!user && !!clientId,
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading credit limit</div>;
    }

    return (
        <Container>
            <ChargedSection />
            <PaymentMethods />
            <PaymentSummary />
            <MarkAsReceivableButton
                creditLimit={creditLimit}
            />
            <ReceivableManagementPanel
                form={form}
                creditLimit={creditLimit}
            />
            <PrintControl />
        </Container>
    )
}

const Container = styled.div`
        display: grid;
        gap: 1.4em;
    `