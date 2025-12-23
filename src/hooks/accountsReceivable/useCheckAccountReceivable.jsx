import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAR } from '@/features/accountsReceivable/accountsReceivableSlice';
import { fbGetActiveARCount } from '@/firebase/accountsReceivable/fbGetActiveARCount';

export const useCreditLimitCheck = (
  creditLimit,
  change,
  clientId,
  userBusinessId,
) => {
  const { currentBalance } = useSelector(selectAR);
  const [activeAccountsReceivableCount, setActiveAccountsReceivableCount] =
    useState(0);
  const [isWithinInvoiceCount, setIsWithinInvoiceCount] = useState(null);

  useEffect(() => {
    const fetchInvoiceAvailableCount = async () => {
      if (creditLimit?.invoice?.status) {
        const invoiceAvailableCount = await fbGetActiveARCount(
          userBusinessId,
          clientId,
        );
        setActiveAccountsReceivableCount(invoiceAvailableCount);
        // Corregido: usar < en lugar de <= para la validación
        setIsWithinInvoiceCount(
          invoiceAvailableCount < (creditLimit?.invoice?.value || 0),
        );
      } else {
        setIsWithinInvoiceCount(true);
      }
    };
    fetchInvoiceAvailableCount();
  }, [clientId, userBusinessId, creditLimit]);

  // Derivar isWithinCreditLimit y creditLimitValue con useMemo en lugar de effect
  const { isWithinCreditLimit, creditLimitValue } = useMemo(() => {
    if (creditLimit?.creditLimit?.status && currentBalance !== null) {
      const adjustedCreditLimit = currentBalance + -change;
      return {
        isWithinCreditLimit: adjustedCreditLimit <= creditLimit?.creditLimit?.value,
        creditLimitValue: adjustedCreditLimit,
      };
    }
    return {
      isWithinCreditLimit: true,
      creditLimitValue: 0,
    };
  }, [creditLimit, currentBalance, change]);

  return {
    activeAccountsReceivableCount,
    isWithinCreditLimit,
    isWithinInvoiceCount,
    creditLimitValue,
  };
};
