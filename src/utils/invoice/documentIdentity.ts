/**
 * Document identity types for invoices and receipts
 */

export interface DocumentIdentity {
  title: string;
  label: string;
  value: string | number | null;
  description: string;
  type:
    | 'fiscal-credit'
    | 'fiscal-consumer'
    | 'fiscal-generic'
    | 'preorder'
    | 'receipt';
}

interface InvoiceLike {
  NCF?: string;
  comprobante?: string;
  type?: string;
  status?: string;
  numberID?: string | number;
  id?: string;
  preorderDetails?: {
    isOrWasPreorder?: boolean;
    numberID?: string | number;
  };
  [key: string]: unknown;
}

interface PreorderCheckOptions {
  rawNcf?: string;
}

const RECEIPT_MAP: Record<string, Omit<DocumentIdentity, 'value'>> = {
  B01: {
    title: 'FACTURA DE CRÉDITO FISCAL',
    label: 'NCF',
    description: 'FACTURA PARA CRÉDITO FISCAL',
    type: 'fiscal-credit',
  },
  B02: {
    title: 'FACTURA DE CONSUMO',
    label: 'NCF',
    description: 'FACTURA PARA CONSUMIDOR FINAL',
    type: 'fiscal-consumer',
  },
};

const RECEIPT_FALLBACK: Omit<DocumentIdentity, 'value'> = {
  title: 'COMPROBANTE FISCAL',
  label: 'NCF',
  description: 'COMPROBANTE FISCAL',
  type: 'fiscal-generic',
};

const PREORDER_ACTIVE_STATUSES = new Set([
  'pending',
  'preorder',
  'cancelled-preorder',
]);

export const isPreorderDocument = (
  invoice: InvoiceLike | null | undefined = {},
  { rawNcf }: PreorderCheckOptions = {},
): boolean => {
  if (!invoice) {
    return false;
  }

  const normalizedNcf = (rawNcf ?? invoice?.NCF ?? invoice?.comprobante ?? '')
    .toString()
    .trim();
  if (normalizedNcf) {
    return false;
  }

  const isExplicitPreorder = invoice?.type === 'preorder';
  const isMarkedAsPreorder = invoice?.preorderDetails?.isOrWasPreorder === true;
  if (!isExplicitPreorder && !isMarkedAsPreorder) {
    return false;
  }

  const statusRaw = invoice?.status;
  const status = typeof statusRaw === 'string' ? statusRaw : 'pending';
  if (status === 'completed') {
    return false;
  }

  // If the document is explicitly a preorder and has no NCF,
  // treat it as a preorder even if legacy data corrupted status.
  return PREORDER_ACTIVE_STATUSES.has(status) || isExplicitPreorder;
};

export function resolveDocumentIdentity(
  invoice: InvoiceLike | null | undefined = {},
): DocumentIdentity {
  const rawNcf = (invoice?.NCF ?? invoice?.comprobante ?? '').toString().trim();
  const isPreorder = isPreorderDocument(invoice, { rawNcf });
  const preorderNumber =
    invoice?.preorderDetails?.numberID ??
    invoice?.numberID ??
    invoice?.id ??
    null;

  if (isPreorder) {
    return {
      title: 'PREVENTA',
      label: 'Número de Preventa',
      value: preorderNumber ?? null,
      description: 'PREVENTA',
      type: 'preorder',
    };
  }

  if (!rawNcf) {
    return {
      title: 'RECIBO DE PAGO',
      label: 'Número de Recibo',
      value: invoice?.numberID ?? null,
      description: 'RECIBO DE PAGO',
      type: 'receipt',
    };
  }

  const upperNcf = rawNcf.toUpperCase();
  const prefix = upperNcf.slice(0, 3);
  const match = RECEIPT_MAP[prefix] ?? RECEIPT_FALLBACK;

  return {
    ...match,
    value: upperNcf,
  };
}
