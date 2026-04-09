import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fbGetActiveARCount } from '@/firebase/accountsReceivable/fbGetActiveARCount';
import { resolveCreditLimitStatus } from '@/utils/accountsReceivable/creditLimit';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';

export const useCreditLimitCheck = (
  creditLimit: CreditLimitConfig | null | undefined,
  change: number,
  clientId: string | null | undefined,
  businessID: string | null | undefined,
) => {
  // Fetch active accounts receivable count
  const { data: activeAccountsReceivableCount = 0 } = useQuery<number>({
    queryKey: ['activeARCount', businessID, clientId],
    queryFn: () => fbGetActiveARCount(businessID, clientId),
    enabled: Boolean(businessID && clientId && clientId !== 'GC-0000'),
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Memoize all calculations to prevent unnecessary recalculations
  return useMemo(() => {
    const status = resolveCreditLimitStatus({
      creditLimit,
      activeAccountsReceivableCount,
      change,
    });

    return { ...status, change };
  }, [creditLimit, change, activeAccountsReceivableCount]);
};
