import type { InvoiceProduct, InvoiceProductAmount } from '@/types/invoice';

export const resolveQuantity = (
  amount: InvoiceProduct['amountToBuy'],
): number => {
  if (typeof amount === 'number' && Number.isFinite(amount)) return amount;

  if (typeof amount === 'object' && amount !== null) {
    const amountObj = amount as InvoiceProductAmount;
    if (typeof amountObj.unit === 'number' && Number.isFinite(amountObj.unit)) {
      return amountObj.unit;
    }
    if (
      typeof amountObj.total === 'number' &&
      Number.isFinite(amountObj.total)
    ) {
      return amountObj.total;
    }
  }

  return 1;
};
