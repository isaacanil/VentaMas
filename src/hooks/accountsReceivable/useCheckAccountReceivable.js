import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

// import { fbGetActiveAccountsReceivableCount } from '@/firebase/accountsReceivable/fbGetActiveAccountsReceivableCount';
import { fbGetActiveARCount } from '@/firebase/accountsReceivable/fbGetActiveARCount';

export const useCreditLimitCheck = (
  creditLimit,
  change,
  clientId,
  businessID,
) => {
  // Fetch active accounts receivable count
  const { data: activeAccountsReceivableCount = 0 } = useQuery({
    queryKey: ['activeARCount', businessID, clientId],
    queryFn: () => fbGetActiveARCount(businessID, clientId),
    enabled: !!businessID && !!clientId && clientId !== 'GC-0000',
    refetchOnWindowFocus: false,
  });

  // Memoize all calculations to prevent unnecessary recalculations
  return useMemo(() => {
    // If there's no creditLimit data, return default values
    if (!creditLimit || !creditLimit.creditLimit) {
      return {
        activeAccountsReceivableCount,
        isWithinCreditLimit: false,
        isWithinInvoiceCount: false,
        creditLimitValue: 0,
        change,
      };
    } // Otherwise, perform full check
    const creditLimitValue = creditLimit.creditLimit?.value || 0;
    const maxInvoices = creditLimit.invoice?.value || 0; // Corregido: usar creditLimit.invoice.value
    const currentBalance = creditLimit.currentBalance || 0;

    // Get the absolute value of the negative change
    const absoluteChange = change < 0 ? Math.abs(change) : 0;

    // Will the new credit exceed the limit? Solo validar si el límite de crédito está habilitado
    const isWithinCreditLimit =
      !creditLimit.creditLimit?.status ||
      currentBalance + absoluteChange <= creditLimitValue;

    // Is the number of active invoices within the allowed maximum?
    // 14 < 15 debe ser true (válido), 15 < 15 debe ser false (límite alcanzado)
    const isWithinInvoiceCount =
      !creditLimit.invoice?.status ||
      (activeAccountsReceivableCount || 0) < maxInvoices;
    return {
      activeAccountsReceivableCount,
      isWithinCreditLimit,
      isWithinInvoiceCount,
      creditLimitValue: currentBalance + absoluteChange, // Devolver el nuevo balance calculado
      change,
    };
  }, [creditLimit, change, activeAccountsReceivableCount]);
};
