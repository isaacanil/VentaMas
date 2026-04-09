import type { InvoiceProductAmount } from '@/types/invoice';
import { toNumber } from '@/utils/number/toNumber';

export const resolveInvoiceAmount = (
  amount?: number | InvoiceProductAmount | null,
): number => {
  if (typeof amount === 'number') return toNumber(amount);
  if (amount && typeof amount === 'object') {
    const candidate = amount.total ?? amount.unit ?? 0;
    return toNumber(candidate);
  }
  return 0;
};
