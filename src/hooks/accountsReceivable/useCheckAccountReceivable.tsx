import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAR } from '../../features/accountsReceivable/accountsReceivableSlice';
import { fbGetActiveARCount } from '../../firebase/accountsReceivable/fbGetActiveARCount';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';

type AccountsReceivableRootState = Parameters<typeof selectAR>[0];
type AccountsReceivableData = ReturnType<typeof selectAR>;

export const useCreditLimitCheck = (
  creditLimit: CreditLimitConfig | null | undefined,
  change: number,
  clientId: string | null | undefined,
  userBusinessId: string | null | undefined,
) => {
  const { currentBalance } = useSelector<
    AccountsReceivableRootState,
    AccountsReceivableData
  >(selectAR);
  const [activeAccountsReceivableCount, setActiveAccountsReceivableCount] =
    useState<number>(0);

  useEffect(() => {
    const fetchInvoiceAvailableCount = async () => {
      if (creditLimit?.invoice?.status) {
        const invoiceAvailableCount = await fbGetActiveARCount(
          userBusinessId,
          clientId,
        );
        setActiveAccountsReceivableCount(invoiceAvailableCount);
        return;
      }

      setActiveAccountsReceivableCount(0);
    };
    fetchInvoiceAvailableCount();
  }, [clientId, userBusinessId, creditLimit]);

  const isWithinInvoiceCount = useMemo(() => {
    if (!creditLimit?.invoice?.status) {
      return true;
    }

    return activeAccountsReceivableCount < (creditLimit?.invoice?.value || 0);
  }, [activeAccountsReceivableCount, creditLimit]);

  // Derivar isWithinCreditLimit y creditLimitValue con useMemo en lugar de effect
  const { isWithinCreditLimit, creditLimitValue } = useMemo(() => {
    if (creditLimit?.creditLimit?.status && currentBalance !== null) {
      const adjustedCreditLimit = currentBalance + -change;
      return {
        isWithinCreditLimit:
          adjustedCreditLimit <= creditLimit?.creditLimit?.value,
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
