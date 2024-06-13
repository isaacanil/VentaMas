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

export const Body = ({ form }) => {
    const [creditLimit, setCreditLimit] = useState(null);
    const user = useSelector(selectUser);
    const client = useSelector(selectClient);
    const clientId = client.id;
    useEffect(() => {
        const fetchCreditLimit = async () => {
            if (user && client.id) {
                const creditLimitData = await fbGetCreditLimit({ user, clientId });
                if (creditLimitData) {
                    setCreditLimit(creditLimitData);
                }
            }
        };
        fetchCreditLimit();
    }, [user, client.id]);
    return (
        <Container>
            <ChargedSection />
            <PaymentMethods />
            <PaymentSummary />
            <MarkAsReceivableButton />
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