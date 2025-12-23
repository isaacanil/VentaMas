import { fbRecordAuthorizationApproval } from '@/firebase/authorization/approvalLogs';

const extractAmount = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object') {
    if (typeof value.value === 'number') return value.value;
    if (typeof value.amount === 'number') return value.amount;
  }
  return null;
};

const sanitizeUserSnapshot = (userLike) => {
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

const buildInvoiceTarget = ({ invoice, cart, discountAuth }) => {
  const invoiceNumber =
    invoice?.numberID || invoice?.numberId || invoice?.invoiceNumber;

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
}) => {
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

    const description =
      discountAuth?.description ||
      `Autorización aplicada en factura ${invoice?.numberID || invoice?.numberId || invoice?.invoiceNumber || ''}`.trim();

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
        invoiceNumber:
          invoice?.numberID ||
          invoice?.numberId ||
          invoice?.invoiceNumber ||
          null,
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
