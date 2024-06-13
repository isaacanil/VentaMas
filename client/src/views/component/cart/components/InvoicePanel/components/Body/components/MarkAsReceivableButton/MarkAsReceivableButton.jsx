import * as antd from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { SelectCartData, toggleReceivableStatus } from '../../../../../../../../../features/cart/cartSlice';
import { calculateInvoiceChange } from '../../../../../../../../../utils/invoice';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { resetAR, selectAR, setAR } from '../../../../../../../../../features/accountsReceivable/accountsReceivableSlice';
import styled from 'styled-components';
import { selectUser } from '../../../../../../../../../features/auth/userSlice';
import { fbGetCreditLimit } from '../../../../../../../../../firebase/accountsReceivable/fbGetCreditLimit';
import { fbGetActiveARCount } from '../../../../../../../../../firebase/accountsReceivable/fbGetActiveARCount';
import { useFormatPrice } from '../../../../../../../../../hooks/useFormatPrice';
import { useFormatNumber } from '../../../../../../../../../hooks/useFormatNumber';
import ColoredNumber from '../../../../../../../../templates/system/ColoredNumber/ColoredNumber';
const { Button, Alert } = antd;

export const MarkAsReceivableButton = () => {
    const dispatch = useDispatch();
    const [creditLimit, setCreditLimit] = useState(null);
    const [activeAccountsReceivableCount, setActiveAccountsReceivableCount] = useState(0);
    const [isWithinCreditLimit, setIsWithinCreditLimit] = useState(null);
    const [isWithinInvoiceCount, setIsWithinInvoiceCount] = useState(null);
    const [creditLimitValue, setCreditLimitValue] = useState(0);
    const {
        currentBalance,
    } = useSelector(selectAR)

    const cartData = useSelector(SelectCartData);
    const user = useSelector(selectUser);
    const change = useMemo(() => calculateInvoiceChange(cartData), [cartData]);
    const client = cartData?.client;

    const isChangeNegative = change < 0;
    const clientId = cartData?.client?.id;
    const isGenericClient = clientId === 'GC-0000';
    const isAddedToReceivables = cartData?.isAddedToReceivables;
    const receivableStatus = isAddedToReceivables && isWithinCreditLimit;

    useEffect(() => {
        if (!cartData.isAddedToReceivables) {
            dispatch(resetAR())
        }
    }, [cartData?.isAddedToReceivables])

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
    useEffect(() => {
        const fetchInvoiceAvailableCount = async () => {
            if (creditLimit?.invoice?.status) {
                const invoiceAvailableCount = await fbGetActiveARCount(user.businessID, clientId)
                setActiveAccountsReceivableCount(invoiceAvailableCount);
                setIsWithinInvoiceCount(invoiceAvailableCount <= creditLimit?.invoice?.value || 0);
            }
        }
        fetchInvoiceAvailableCount()
    }, [clientId, user, creditLimit])
    useEffect(() => {
        if (creditLimit?.creditLimit?.status && currentBalance !== null) {
            const adjustedCreditLimit = (currentBalance) + (-change);
            setIsWithinCreditLimit(adjustedCreditLimit <= creditLimit?.creditLimit?.value);
            setCreditLimitValue(adjustedCreditLimit);
        }
    }, [creditLimit, currentBalance, change]);

    function handleClick() {
        if (!creditLimit?.creditLimit?.status || !creditLimit?.invoice?.status) {
            antd.notification.error({
                message: 'Error',
                description: 'Los límites de crédito o las facturas no son válidos'
            });
            return;
        }
        const invoiceId = cartData.id;
        if (isGenericClient) {
            antd.notification.error({
                message: 'Error',
                description: 'No se puede agregar a CXC a un cliente genérico'
            })
            return
        }
        if (!clientId && !invoiceId) {
            antd.notification.error({
                message: 'Error',
                description: 'No se puede agregar a CXC sin cliente o factura'
            })
            return
        }
        if (isChangeNegative) {
            dispatch(toggleReceivableStatus())
        }
        if (!receivableStatus) {
            dispatch(setAR({ clientId, invoiceId }))
        } else {
            dispatch(resetAR())
        }
    }

    return (
        <Fragment>
            {isChangeNegative && (
                <Container>
                    <Button
                        style={{ width: '100%' }}
                        onClick={handleClick}
                        spellCheck={true}
                        disabled={isGenericClient || !isWithinCreditLimit || !isWithinInvoiceCount}
                    >
                        {receivableStatus ? 'Quitar de CXC' : 'Agregar a CXC'}
                    </Button>
                    <ARValidateMessage
                        isGenericClient={isGenericClient}
                        clientId={clientId}
                        invoiceId={cartData.id}
                        isChangeNegative={isChangeNegative}
                        isWithinCreditLimit={isWithinCreditLimit}
                        isWithinInvoiceCount={isWithinInvoiceCount}
                        activeAccountsReceivableCount={activeAccountsReceivableCount}
                        currentBalance={currentBalance}
                        creditLimit={creditLimit}
                        creditLimitValue={creditLimitValue}
                    />
                </Container>
            )}
        </Fragment>

    );

}
const Container = styled.div`
    display: grid;
    gap: 0.4em;
`
export const ARValidateMessage = ({
    isGenericClient,
    clientId,
    invoiceId,
    isWithinCreditLimit,
    isWithinInvoiceCount,
    activeAccountsReceivableCount,
    creditLimit,
    currentBalance,
    creditLimitValue
}) => {
    return (
        <>
            {
                isGenericClient && <Alert
                    message="No se puede agregar a CXC a un cliente genérico"
                    type="error"
                    showIcon
                />
            }
            {
                !clientId && !invoiceId && <Alert
                    message="No se puede agregar a CXC sin cliente o factura"
                    type="error"
                    showIcon
                />
            }
            {
                !isWithinCreditLimit && <Alert
                message={
                    <>
                      El saldo de la factura excede el límite de crédito:{" "}
                      <ColoredNumber value={useFormatPrice(creditLimitValue)} color={'red'} /> / {" "}
                      <ColoredNumber value={useFormatPrice(creditLimit?.creditLimit?.value)}/>
                      
                    </>
                  }
                    type="error"
                    showIcon
                />
            }
            {
                !isWithinInvoiceCount && <Alert
                    message={`El límite de cuenta por cobrar ha sido alcanzado. Facturas actuales: ${useFormatNumber(activeAccountsReceivableCount)} / ${useFormatNumber(creditLimit?.invoice?.value)}`}
                    type="error"
                    showIcon
                />
            }
        </>
    )
}

