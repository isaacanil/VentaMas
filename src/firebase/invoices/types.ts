import type {
  InvoiceData,
  InvoiceFirestoreDoc,
  InvoiceProduct,
} from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

export type InvoiceUser = UserIdentity & {
  uid: string;
  businessID: string;
};

export type InvoiceDoc = InvoiceFirestoreDoc & {
  data: InvoiceData;
};

export type InvoiceDocWithId = InvoiceDoc & {
  id: string;
};

export const isInvoiceUser = (
  user: UserIdentity | null | undefined,
): user is InvoiceUser => Boolean(user?.uid && user?.businessID);

export const getInvoiceProductQuantity = (
  product: InvoiceProduct | null | undefined,
): number => {
  if (!product) return 0;
  const amount = product.amountToBuy;
  if (typeof amount === 'number') return amount;
  if (amount && typeof amount === 'object') {
    const total =
      'total' in amount && amount.total !== undefined
        ? Number(amount.total)
        : 0;
    const unit =
      'unit' in amount && amount.unit !== undefined ? Number(amount.unit) : 0;
    return Number.isFinite(total) && total !== 0 ? total : unit;
  }
  return 0;
};
