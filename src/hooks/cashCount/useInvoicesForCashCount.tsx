import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/features/auth/userSlice';
import { fbLoadInvoicesForCashCount } from '@/firebase/cashCount/fbLoadInvoicesForCashCount';
import type { CashCountInvoice } from '@/utils/cashCount/types';

const EMPTY_INVOICES: CashCountInvoice[] = [];

export const useInvoicesForCashCount = (cashCountId?: string | null) => {
  const user = useSelector(selectUser);

  const query = useQuery({
    queryKey: ['invoices', user?.businessID, cashCountId],
    queryFn: () => fbLoadInvoicesForCashCount(user, cashCountId),
    enabled: !!user?.businessID && !!cashCountId,
    staleTime: 15000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const data = (query.data as CashCountInvoice[] | undefined) ?? EMPTY_INVOICES;

  return useMemo(() => ({
    data,
    loading: query.isLoading,
    error: query.error,
    count: data.length,
    refetch: query.refetch,
  }), [data, query.isLoading, query.error, query.refetch]);
};
