import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { selectUser } from '@/features/auth/userSlice';
import { fbLoadInvoicesForCashCount } from '@/firebase/cashCount/fbLoadInvoicesForCashCount';
import type { CashCountInvoice } from '@/utils/cashCount/types';

export const useInvoicesForCashCount = (cashCountId?: string | null) => {
  const user = useSelector(selectUser);

  const query = useQuery({
    queryKey: ['invoices', user?.businessID, cashCountId],
    queryFn: () => fbLoadInvoicesForCashCount(user, cashCountId),
    enabled: !!user?.businessID && !!cashCountId,
  });

  return {
    data: (query.data as CashCountInvoice[] | undefined) ?? [],
    loading: query.isLoading,
    error: query.error,
    count: (query.data as CashCountInvoice[] | undefined)?.length || 0,
    refetch: query.refetch,
  };
};
