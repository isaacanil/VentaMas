import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAR } from '@/features/accountsReceivable/accountsReceivableSlice';
import { selectUser } from '@/features/auth/userSlice';
import { fbGetActiveARCount } from '@/firebase/accountsReceivable/fbGetActiveARCount';
import { calculateInvoiceChange } from '@/utils/invoice';

export const useARValidation = (cartData, creditLimit) => {
  const user = useSelector(selectUser);
  const change = useMemo(() => calculateInvoiceChange(cartData), [cartData]);
  const clientId = cartData?.client?.id;
  const { currentBalance } = useSelector(selectAR);

  const isGenericClient = clientId === 'GC-0000' || clientId === null;
  const isChangeNegative = change < 0;

  const { data: activeAccountsReceivableCount = 0 } = useQuery({
    queryKey: ['activeARCount', user.businessID, clientId],
    queryFn: () => fbGetActiveARCount(user.businessID, clientId),
    enabled: Boolean(
      creditLimit?.invoice?.status && clientId && user.businessID,
    ),
    staleTime: 60000,
  });

  const isWithinInvoiceCount =
    !creditLimit?.invoice?.status ||
    activeAccountsReceivableCount < (creditLimit?.invoice?.value || 0);

  const creditLimitValue =
    creditLimit?.creditLimit?.status && currentBalance !== null
      ? currentBalance + -change
      : 0;

  const isWithinCreditLimit =
    !creditLimit?.creditLimit?.status ||
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
