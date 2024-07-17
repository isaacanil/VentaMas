import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { fbGetActiveARCount } from '../../firebase/accountsReceivable/fbGetActiveARCount';
import { selectAR } from '../../features/accountsReceivable/accountsReceivableSlice';

export const useCreditLimitCheck = (creditLimit, change, clientId, userBusinessId) => {
  const { currentBalance } = useSelector(selectAR);
  const [activeAccountsReceivableCount, setActiveAccountsReceivableCount] = useState(0);
  const [isWithinCreditLimit, setIsWithinCreditLimit] = useState(null);
  const [isWithinInvoiceCount, setIsWithinInvoiceCount] = useState(null);
  const [creditLimitValue, setCreditLimitValue] = useState(0);
  

  useEffect(() => {
    const fetchInvoiceAvailableCount = async () => {
      if (creditLimit?.invoice?.status) {
        const invoiceAvailableCount = await fbGetActiveARCount(userBusinessId, clientId);
        setActiveAccountsReceivableCount(invoiceAvailableCount);
        setIsWithinInvoiceCount(invoiceAvailableCount <= (creditLimit?.invoice?.value || 0));
      } else {
        setIsWithinInvoiceCount(true);
      }
    };
    fetchInvoiceAvailableCount();
  }, [clientId, userBusinessId, creditLimit]);

  useEffect(() => {
    if (creditLimit?.creditLimit?.status && currentBalance !== null) {
      const adjustedCreditLimit = currentBalance + (-change);
      setIsWithinCreditLimit(adjustedCreditLimit <= creditLimit?.creditLimit?.value);
      setCreditLimitValue(adjustedCreditLimit);
    } else {
      setIsWithinCreditLimit(true);
    }
  }, [creditLimit, currentBalance, change]);

  return {
    activeAccountsReceivableCount,
    isWithinCreditLimit,
    isWithinInvoiceCount,
    creditLimitValue,
  };
};