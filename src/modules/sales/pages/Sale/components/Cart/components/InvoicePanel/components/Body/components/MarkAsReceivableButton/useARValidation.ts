import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAR } from '@/features/accountsReceivable/accountsReceivableSlice';
import { selectUser } from '@/features/auth/userSlice';
import { fbGetActiveARCount } from '@/firebase/accountsReceivable/fbGetActiveARCount';
import { resolveCreditLimitStatus } from '@/utils/accountsReceivable/creditLimit';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';
import { calculateInvoiceChange } from '@/utils/invoice';
import { toNumber } from '@/utils/number/toNumber';
import type { UserIdentity } from '@/types/users';

type CartLike = {
  client?: { id?: string | null };
} & Record<string, unknown>;

export const useARValidation = (
  cartData: CartLike | null | undefined,
  creditLimit: CreditLimitConfig | null | undefined,
) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const change = useMemo(() => {
    if (!cartData) return 0;
    return toNumber(calculateInvoiceChange(cartData), 0);
  }, [cartData]);
  const clientId = cartData?.client?.id ?? null;
  const { currentBalance } = useSelector(selectAR) as {
    currentBalance?: number | null;
  };

  const isGenericClient = clientId === 'GC-0000' || clientId === null;
  const isChangeNegative = change < 0;

  const { data: activeAccountsReceivableCount = 0 } = useQuery<number>({
    queryKey: ['activeARCount', user?.businessID, clientId],
    queryFn: () => fbGetActiveARCount(user?.businessID ?? null, clientId),
    enabled: Boolean(
      creditLimit?.invoice?.status && clientId && user?.businessID,
    ),
    staleTime: 60000,
  });

  const { isWithinCreditLimit, isWithinInvoiceCount, creditLimitValue } =
    useMemo(
      () =>
        resolveCreditLimitStatus({
          creditLimit,
          activeAccountsReceivableCount,
          change,
          currentBalance,
        }),
      [creditLimit, activeAccountsReceivableCount, change, currentBalance],
    );

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
