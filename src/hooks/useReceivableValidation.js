import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAR } from '@/features/accountsReceivable/accountsReceivableSlice';
import { selectUser } from '@/features/auth/userSlice';
import { SelectCartData } from '@/features/cart/cartSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import { fbGetActiveARCount } from '@/firebase/accountsReceivable/fbGetActiveARCount';
import { calculateInvoiceChange } from '@/utils/invoice';

export const useReceivableValidation = (creditLimit) => {
  const [activeAccountsReceivableCount, setActiveAccountsReceivableCount] =
    useState(0);
  const [isWithinInvoiceCount, setIsWithinInvoiceCount] = useState(null);

  const cartData = useSelector(SelectCartData);
  const client = useSelector(selectClient);
  const user = useSelector(selectUser);
  const { currentBalance } = useSelector(selectAR);

  const change = calculateInvoiceChange(cartData);
  const clientId = client?.id;
  const isGenericClient = clientId === 'GC-0000';
  const isChangeNegative = change < 0;

  useEffect(() => {
    const fetchInvoiceAvailableCount = async () => {
      if (creditLimit?.invoice?.status) {
        const invoiceAvailableCount = await fbGetActiveARCount(
          user.businessID,
          clientId,
        );
        setActiveAccountsReceivableCount(invoiceAvailableCount);
        // Corregido: usar < en lugar de <= y agregar paréntesis correctos
        setIsWithinInvoiceCount(
          invoiceAvailableCount < (creditLimit?.invoice?.value || 0),
        );
      } else {
        setIsWithinInvoiceCount(true);
      }
    };
    fetchInvoiceAvailableCount();
  }, [clientId, user, creditLimit]);

  // Derive credit limit validation values instead of using useEffect + setState
  const { isWithinCreditLimit, creditLimitValue } = useMemo(() => {
    if (creditLimit?.creditLimit?.status && currentBalance !== null) {
      const adjustedCreditLimit = currentBalance + -change;
      return {
        isWithinCreditLimit:
          adjustedCreditLimit <= creditLimit?.creditLimit?.value,
        creditLimitValue: adjustedCreditLimit,
      };
    }
    return { isWithinCreditLimit: true, creditLimitValue: 0 };
  }, [creditLimit, currentBalance, change]);

  const { isValid, errorMessage } = useMemo(() => {
    let newErrorMessage = '';
    let newIsValid = true;

    if (isGenericClient) {
      newErrorMessage = 'No se puede agregar a CXC a un cliente genérico';
      newIsValid = false;
    } else if (!clientId) {
      newErrorMessage = 'No se puede agregar a CXC sin cliente';
      newIsValid = false;
    } else if (!isChangeNegative) {
      newErrorMessage =
        'La cantidad debe ser negativa para ser una cuenta por cobrar';
      newIsValid = false;
    } else if (!isWithinCreditLimit) {
      newErrorMessage = `El saldo de la factura excede el límite de crédito: ${creditLimitValue} / ${creditLimit?.creditLimit?.value}`;
      newIsValid = false;
    } else if (!isWithinInvoiceCount) {
      newErrorMessage = `El límite de cuenta por cobrar ha sido alcanzado. Facturas actuales: ${activeAccountsReceivableCount} / ${creditLimit?.invoice?.value}`;
      newIsValid = false;
    } else if (creditLimit == null) {
      newErrorMessage =
        'Para agregar a CXC, el cliente debe tener un límite de crédito configurado.';
      newIsValid = false;
    }

    return { isValid: newIsValid, errorMessage: newErrorMessage };
  }, [
    isGenericClient,
    clientId,
    isChangeNegative,
    isWithinCreditLimit,
    isWithinInvoiceCount,
    creditLimit,
    creditLimitValue,
    activeAccountsReceivableCount,
  ]);

  return {
    isValid,
    errorMessage,
    isWithinCreditLimit,
    isWithinInvoiceCount,
    activeAccountsReceivableCount,
    creditLimitValue,
  };
};
