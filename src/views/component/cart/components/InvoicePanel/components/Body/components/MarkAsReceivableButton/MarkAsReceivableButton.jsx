import { Button, Alert, notification } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { SelectCartData, toggleReceivableStatus } from '../../../../../../../../../features/cart/cartSlice';
import { calculateInvoiceChange } from '../../../../../../../../../utils/invoice';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { resetAR, selectAR, setAR } from '../../../../../../../../../features/accountsReceivable/accountsReceivableSlice';
import styled from 'styled-components';
import { selectUser } from '../../../../../../../../../features/auth/userSlice';
import { fbGetActiveARCount } from '../../../../../../../../../firebase/accountsReceivable/fbGetActiveARCount';
import { useQuery } from '@tanstack/react-query';


// Hook personalizado para manejar la lógica de AR
export const useARValidation = (cartData, creditLimit) => {
    const user = useSelector(selectUser);
    const change = useMemo(() => calculateInvoiceChange(cartData), [cartData]);
    const client = cartData?.client;
    const clientId = cartData?.client?.id;
    const { currentBalance } = useSelector(selectAR);
    
    const isGenericClient = clientId === 'GC-0000' || clientId === null;
    const isChangeNegative = change < 0;
    
    // React Query para obtener el recuento de AR activos
    const { data: activeAccountsReceivableCount = 0 } = useQuery
    (
        {
        queryKey: ['activeARCount', user.businessID, clientId],
        queryFn: () => fbGetActiveARCount(user.businessID, clientId),
        enabled: Boolean(creditLimit?.invoice?.status && clientId && user.businessID),
        staleTime: 60000,
        }
    );
      // Calcular si está dentro del límite de factura
    const isWithinInvoiceCount = !creditLimit?.invoice?.status || 
      activeAccountsReceivableCount < (creditLimit?.invoice?.value || 0);
    
    // Calcular si está dentro del límite de crédito
    const creditLimitValue = creditLimit?.creditLimit?.status && currentBalance !== null ? 
      (currentBalance) + (-change) : 0;
    
    const isWithinCreditLimit = !creditLimit?.creditLimit?.status || 
      creditLimitValue <= creditLimit?.creditLimit?.value;
    
    return {
      isGenericClient,
      isChangeNegative,
      isWithinCreditLimit,
      isWithinInvoiceCount,
      activeAccountsReceivableCount,
      creditLimitValue,
      clientId,
    };
  };

export const MarkAsReceivableButton = ({creditLimit = null, setIsOpen, isOpen}) => {
    const dispatch = useDispatch();
    // const [activeAccountsReceivableCount, setActiveAccountsReceivableCount] = useState(0);
    // const [isWithinCreditLimit, setIsWithinCreditLimit] = useState(null);
    // const [isWithinInvoiceCount, setIsWithinInvoiceCount] = useState(null);
    // const [creditLimitValue, setCreditLimitValue] = useState(0);
    const cartData = useSelector(SelectCartData);
    const user = useSelector(selectUser);
    const change = useMemo(() => calculateInvoiceChange(cartData), [cartData]);
    const client = cartData?.client;


    const {
        isGenericClient,
        isChangeNegative,
        isWithinCreditLimit,
        isWithinInvoiceCount,
        activeAccountsReceivableCount,
        creditLimitValue,
        clientId,
      } = useARValidation(cartData, creditLimit);
    
    // const isChangeNegative = change < 0;
    // const clientId = cartData?.client?.id;
    // const isGenericClient = clientId === 'GC-0000' || clientId === null;

    const isAddedToReceivables = cartData?.isAddedToReceivables;
    const receivableStatus = isAddedToReceivables && isWithinCreditLimit;
    const { currentBalance } = useSelector(selectAR);



    useEffect(() => {
        if (!cartData.isAddedToReceivables || !creditLimit) {
            dispatch(resetAR())
        }
    }, [cartData?.isAddedToReceivables, creditLimit])

    // useEffect(() => {
    //     const fetchInvoiceAvailableCount = async () => {
    //         if (creditLimit?.invoice?.status) {
    //             const invoiceAvailableCount = await fbGetActiveARCount(user.businessID, clientId)
    //             // setActiveAccountsReceivableCount(invoiceAvailableCount);
    //             //                setIsWithinInvoiceCount(activeAccountsReceivableCount < (creditLimit?.invoice?.value || 0));
    //         }else{
    //             // setIsWithinInvoiceCount(true)
            
    //         }
    //     }
    //     fetchInvoiceAvailableCount()
    // }, [clientId, user, creditLimit])
    // useEffect(() => {
    //     if (creditLimit?.creditLimit?.status && currentBalance !== null) {
    //         const adjustedCreditLimit = (currentBalance) + (-change);
    //         // setIsWithinCreditLimit(adjustedCreditLimit <= creditLimit?.creditLimit?.value);
    //         // setCreditLimitValue(adjustedCreditLimit);
    //     }else {
    //         // setIsWithinCreditLimit(true)
    //     }
    // }, [creditLimit, currentBalance, change]);

    const isInvoiceOrCreditLimitValid = useMemo(() => {
        return creditLimit?.creditLimit?.status && creditLimit?.invoice?.status;
    }, [creditLimit]);    function handleAddToReceivable() {
        if (!creditLimit?.creditLimit?.status || !creditLimit?.invoice?.status) {
            notification.error({
                message: 'Error',
                description: 'Los límites de crédito o las facturas no son válidos'
            });
            return;
        }
        const invoiceId = cartData.id;
        if (isGenericClient) {
            notification.error({
                message: 'Error',
                description: 'No se puede agregar a CXC a un cliente genérico'
            })
            return
        }
        if (!clientId && !invoiceId) {
            notification.error({
                message: 'Error',
                description: 'No se puede agregar a CXC sin cliente o factura'
            })
            return
        }
        
        if (isChangeNegative) {
            dispatch(toggleReceivableStatus())
        }
        dispatch(setAR({ clientId, invoiceId }))
        // Abrir el modal para configurar
        setIsOpen(true);
    }// Determinar si el botón debe estar deshabilitado y por qué
    const isButtonDisabled = isGenericClient || !isWithinCreditLimit || !isWithinInvoiceCount || !isInvoiceOrCreditLimitValid;
    
    // Generar mensaje de tooltip explicando por qué está deshabilitado
    const getDisabledReason = () => {
        if (isGenericClient) return "Selecciona un cliente específico";
        if (!isWithinCreditLimit) return "Límite de crédito excedido";
        if (!isWithinInvoiceCount) return "Límite de facturas alcanzado";
        if (!isInvoiceOrCreditLimitValid) return "Configura los límites de crédito";
        return "";
    };    return (
        <Fragment>
            {/* Solo mostrar cuando hay cambio negativo Y no está agregado a receivables */}
            {isChangeNegative && !receivableStatus && (
                <Container>
                    <Button
                        style={{ width: '100%' }}
                        onClick={handleAddToReceivable}
                        spellCheck={true}
                        disabled={isButtonDisabled}
                        title={isButtonDisabled ? getDisabledReason() : ""}
                        type="primary"
                    >
                        Agregar a CXC
                    </Button>
                    {/* Mensaje de ayuda cuando está deshabilitado */}
                    {isButtonDisabled && (
                        <div style={{
                            fontSize: '12px',
                            color: '#8c8c8c',
                            textAlign: 'center',
                            marginTop: '4px',
                            fontStyle: 'italic'
                        }}>
                            {getDisabledReason()}
                        </div>
                    )}
                </Container>
            )}
        </Fragment>
    );

}
const Container = styled.div`
    display: grid;
    gap: 0.4em;
`