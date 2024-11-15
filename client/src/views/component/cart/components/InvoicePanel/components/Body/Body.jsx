import React, { Fragment, useEffect, useState } from 'react'
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
import { useCreditLimitCheck } from '../../../../../../../hooks/accountsReceivable/useCheckAccountReceivable'
import { SelectCartData } from '../../../../../../../features/cart/cartSlice'
import { userAccess } from '../../../../../../../hooks/abilities/useAbilities'
import * as antd from 'antd'
const { Alert, Form } = antd

export const Body = ({ form }) => {
    const user = useSelector(selectUser);
    const client = useSelector(selectClient);
    const cartData = useSelector(SelectCartData);
    const clientId = client.id;

    const { abilities } = userAccess();

    const { data: creditLimit, error, isLoading } = useQuery({
        queryKey: ['creditLimit', user, clientId],
        queryFn: () => fbGetCreditLimit({ user, clientId }),
        enabled: !!user && !!clientId,
        refetchOnWindowFocus: false,
    });

    const {
        activeAccountsReceivableCount,
        isWithinCreditLimit,
        isWithinInvoiceCount,
        creditLimitValue,
        change
    } = useCreditLimitCheck(creditLimit, cartData.change.value, clientId, user.businessID);

    const isAddedToReceivables = cartData?.isAddedToReceivables;
    const receivableStatus = isAddedToReceivables && isWithinCreditLimit;

    const isChangeNegative = cartData.change.value < 0;

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading credit limit</div>;
    }

    return (
        <Form
            form={form}
            layout="vertical"
        >
            <Container>
                <ChargedSection />
                <PaymentMethods />
                <PaymentSummary />
                {
                    abilities.can('manage', 'accountReceivable') ? (
                        <Fragment>
                            <MarkAsReceivableButton
                                creditLimit={creditLimit}
                                activeAccountsReceivableCount={activeAccountsReceivableCount}
                                isWithinCreditLimit={isWithinCreditLimit}
                                isWithinInvoiceCount={isWithinInvoiceCount}
                                creditLimitValue={creditLimitValue}
                                change={change}
                                clientId={clientId}
                            />
                            <ReceivableManagementPanel
                                form={form}
                                activeAccountsReceivableCount={activeAccountsReceivableCount}
                                isWithinCreditLimit={isWithinCreditLimit}
                                isWithinInvoiceCount={isWithinInvoiceCount}
                                creditLimit={creditLimit}
                                isChangeNegative={isChangeNegative}
                                receivableStatus={receivableStatus}
                            />
                        </Fragment>
                    ) : (
                        isChangeNegative && (
                            <Alert
                                message='Acceso Restringido'
                                description='No se puede facturar ventas con un cambio negativo a menos que se use cuentas por cobrar. No tienes permisos para usar cuentas por cobrar. Por favor, contacta al administrador para obtener los permisos necesarios.'
                                type='error'
                                showIcon
                            />
                        )
                    )
                }
                <PrintControl />
            </Container>
        </Form>
    )
}

const Container = styled.div`
        display: grid;
        gap: 1.4em;
    `