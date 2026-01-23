import { fbRecordAuthorizationApproval } from '@/firebase/authorization/approvalLogs';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import type { UnknownRecord } from './types';

type AmountLike = {
  value?: number;
  amount?: number;
};

type UserLike = UserIdentity & {
  displayName?: string;
  email?: string;
};

type UserSnapshot = {
  uid: string;
  name: string;
  role: string;
  email: string;
};

type DiscountAuthMetadata = UnknownRecord & {
  cartId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  total?: unknown;
  discountPercent?: unknown;
};

type DiscountAuthorization = UnknownRecord & {
  authorizer?: UserLike | null;
  requestedBy?: UserLike | null;
  targetUser?: UserLike | null;
  description?: string | null;
  module?: string | null;
  action?: string | null;
  metadata?: DiscountAuthMetadata | null;
};

type AuthorizationContext = {
  discount?: DiscountAuthorization | null;
};

type CartClient = {
  id?: string;
  uid?: string;
  name?: string;
};

type CartLike = UnknownRecord & {
  id?: string;
  cartId?: string;
  client?: CartClient | null;
  clientId?: string | null;
  seller?: UserLike | null;
  user?: UserLike | null;
  cashier?: UserLike | null;
};

type InvoiceLike = InvoiceData & {
  invoiceId?: string | number | null;
  invoiceNumber?: string | number | null;
  numberId?: string | number | null;
};

const extractAmount = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object') {
    const amountLike = value as AmountLike;
    if (typeof amountLike.value === 'number') return amountLike.value;
    if (typeof amountLike.amount === 'number') return amountLike.amount;
  }
  return null;
};

const sanitizeUserSnapshot = (
  userLike: UserLike | null | undefined,
): UserSnapshot | null => {
  if (!userLike || typeof userLike !== 'object') {
    return null;
  }

  return {
    uid: userLike.uid || userLike.id || '',
    name: userLike.displayName || userLike.name || '',
    role: userLike.role || '',
    email: userLike.email || '',
  };
};

const resolveInvoiceNumber = (
  invoice: InvoiceLike | null | undefined,
): string | number | null => {
  const candidate =
    invoice?.numberID ?? invoice?.numberId ?? invoice?.invoiceNumber ?? null;
  return typeof candidate === 'string' || typeof candidate === 'number'
    ? candidate
    : null;
};

const buildInvoiceTarget = ({
  invoice,
  cart,
  discountAuth,
}: {
  invoice: InvoiceLike | null | undefined;
  cart: CartLike | null | undefined;
  discountAuth: DiscountAuthorization | null | undefined;
}): UnknownRecord => {
  const invoiceNumber = resolveInvoiceNumber(invoice);

  return {
    type: 'invoice',
    id: invoice?.id || invoice?.invoiceId || '',
    name: invoiceNumber ? `Factura ${invoiceNumber}` : invoice?.id || '',
    details: {
      invoiceNumber: invoiceNumber || null,
      cartId:
        discountAuth?.metadata?.cartId || cart?.id || cart?.cartId || null,
      clientId:
        discountAuth?.metadata?.clientId ||
        cart?.client?.id ||
        cart?.clientId ||
        cart?.client?.uid ||
        null,
      clientName:
        discountAuth?.metadata?.clientName || cart?.client?.name || '',
    },
  };
};

export const logInvoiceAuthorizations = async ({
  user,
  invoice,
  authorizationContext,
  cart,
}: {
  user: UserIdentity | null | undefined;
  invoice: InvoiceLike | null | undefined;
  authorizationContext: AuthorizationContext | null | undefined;
  cart: CartLike | null | undefined;
}): Promise<void> => {
  const discountAuth = authorizationContext?.discount;
  const authorizer = discountAuth?.authorizer;

  const authorizerId = authorizer?.uid || authorizer?.id;
  if (!authorizerId) {
    return;
  }

  try {
    const requestedBy =
      discountAuth?.requestedBy ||
      sanitizeUserSnapshot(cart?.seller || cart?.user || cart?.cashier || user);
    const targetUser = discountAuth?.targetUser || requestedBy;
    const invoiceNumber = resolveInvoiceNumber(invoice);

    const description =
      discountAuth?.description ||
      `Autorización aplicada en factura ${invoiceNumber ?? ''}`.trim();

    await fbRecordAuthorizationApproval({
      businessId: user?.businessID,
      module: discountAuth?.module || 'invoices',
      action: discountAuth?.action || 'invoice-discount-override',
      description,
      requestedBy,
      authorizer,
      targetUser,
      target: buildInvoiceTarget({ invoice, cart, discountAuth }),
      metadata: {
        ...discountAuth?.metadata,
        invoiceId: invoice?.id || invoice?.invoiceId || null,
        invoiceNumber: invoiceNumber ?? null,
        total:
          extractAmount(invoice?.totalPurchase) ??
          extractAmount(discountAuth?.metadata?.total) ??
          null,
        discountPercent:
          extractAmount(invoice?.discount) ??
          extractAmount(discountAuth?.metadata?.discountPercent) ??
          null,
      },
    });
  } catch (error) {
    console.error('Error registrando autorización de factura:', error);
  }
};

export default logInvoiceAuthorizations;
