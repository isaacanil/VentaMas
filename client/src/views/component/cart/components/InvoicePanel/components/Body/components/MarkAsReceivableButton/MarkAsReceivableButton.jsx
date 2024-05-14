import * as antd from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { SelectCartData, toggleReceivableStatus } from '../../../../../../../../../features/cart/cartSlice';
import { calculateInvoiceChange } from '../../../../../../../../../utils/invoice';
import { useEffect, useMemo, useState } from 'react';
import { resetAR, setAR } from '../../../../../../../../../features/accountsReceivable/accountsReceivableSlice';
import styled from 'styled-components';
const { Button, Alert } = antd;

export const MarkAsReceivableButton = () => {
    const dispatch = useDispatch();

    const cartData = useSelector(SelectCartData);

    const change = useMemo(() => calculateInvoiceChange(cartData), [cartData]);
  
    const isChangeNegative = change < 0;
    const clientId = cartData?.client?.id;
    const isGenericClient = clientId === 'GC-0000';
    const receivableStatus = cartData.isAddedToReceivables;

    useEffect(() => {
        if (!cartData.isAddedToReceivables) {
            dispatch(resetAR())
        }
    }, [cartData?.isAddedToReceivables])

    function handleClick() {
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
        isChangeNegative && (
            <Container>
                <Button
                    style={{ width: '100%' }}
                    onClick={handleClick}

                    spellCheck={true}
                    disabled={isGenericClient}
                >
                    {receivableStatus ? 'Quitar de CXC' : 'Agregar a CXC'}

                </Button>
                <ARValidateMessage
                    isGenericClient={isGenericClient}
                    clientId={clientId}
                    invoiceId={cartData.id}
                    isChangeNegative={isChangeNegative}
                />
            </Container>
        )
    );

}
const Container = styled.div`
    display: grid;
    gap: 0.4em;
`
export const ARValidateMessage = ({ isGenericClient, clientId, invoiceId, isChangeNegative }) => {
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
            {/* {
                isChangeNegative && <Alert
                    message="No se puede facturar con cambio negativo"
                    type="error"
                    showIcon
                />
            } */}
        </>
    )
}