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
    | 'fiscal-credit-note'
    | 'fiscal-debit-note'
    | 'fiscal-generic'
    | 'fiscal-government'
    | 'preorder'
    | 'receipt';
}

interface InvoiceLike {
  NCF?: string;
  comprobante?: string;
  eNcf?: string;
  electronicTaxReceipt?: {
    eNcf?: string | null;
    documentType?: string | null;
  } | null;
  fiscal?: {
    electronic?: {
      eNcf?: string | null;
      documentType?: string | null;
    } | null;
  };
  type?: string;
  status?: string;
  number?: string | number;
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
  B03: {
    title: 'NOTA DE DÉBITO',
    label: 'NCF',
    description: 'NOTA DE DÉBITO',
    type: 'fiscal-debit-note',
  },
  B04: {
    title: 'NOTA DE CRÉDITO',
    label: 'NCF',
    description: 'NOTA DE CRÉDITO',
    type: 'fiscal-credit-note',
  },
  B15: {
    title: 'COMPROBANTE GUBERNAMENTAL',
    label: 'NCF',
    description: 'COMPROBANTE GUBERNAMENTAL',
    type: 'fiscal-government',
  },
  E31: {
    title: 'FACTURA DE CRÉDITO FISCAL ELECTRÓNICA',
    label: 'e-NCF',
    description: 'FACTURA ELECTRÓNICA PARA CRÉDITO FISCAL',
    type: 'fiscal-credit',
  },
  E32: {
    title: 'FACTURA DE CONSUMO ELECTRÓNICA',
    label: 'e-NCF',
    description: 'FACTURA ELECTRÓNICA PARA CONSUMIDOR FINAL',
    type: 'fiscal-consumer',
  },
  E33: {
    title: 'NOTA DE DÉBITO ELECTRÓNICA',
    label: 'e-NCF',
    description: 'NOTA DE DÉBITO ELECTRÓNICA',
    type: 'fiscal-debit-note',
  },
  E34: {
    title: 'NOTA DE CRÉDITO ELECTRÓNICA',
    label: 'e-NCF',
    description: 'NOTA DE CRÉDITO ELECTRÓNICA',
    type: 'fiscal-credit-note',
  },
  E45: {
    title: 'COMPROBANTE GUBERNAMENTAL ELECTRÓNICO',
    label: 'e-NCF',
    description: 'COMPROBANTE GUBERNAMENTAL ELECTRÓNICO',
    type: 'fiscal-government',
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

const toCleanUpperString = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase();
};

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
  const electronicSnapshot =
    invoice?.electronicTaxReceipt ?? invoice?.fiscal?.electronic ?? null;
  const electronicNcf = electronicSnapshot?.eNcf ?? invoice?.eNcf;
  const electronicDocumentType = toCleanUpperString(
    electronicSnapshot?.documentType,
  );
  const rawNcf = (electronicNcf ?? invoice?.NCF ?? invoice?.comprobante ?? '')
    .toString()
    .trim();
  const identityCode = rawNcf || electronicDocumentType;
  const isPreorder = isPreorderDocument(invoice, { rawNcf: identityCode });
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

  if (!identityCode) {
    return {
      title: 'RECIBO DE PAGO',
      label: 'Número de Recibo',
      value: invoice?.numberID ?? null,
      description: 'RECIBO DE PAGO',
      type: 'receipt',
    };
  }

  const upperNcf = identityCode.toUpperCase();
  const prefix = upperNcf.slice(0, 3);
  const match = RECEIPT_MAP[prefix] ?? RECEIPT_FALLBACK;

  return {
    ...match,
    value: rawNcf ? upperNcf : null,
  };
}

const resolveOperationalDocumentNumber = (
  invoice: InvoiceLike | null | undefined = {},
): string | number | null =>
  invoice?.numberID ??
  invoice?.number ??
  invoice?.preorderDetails?.numberID ??
  invoice?.id ??
  null;

export function resolveDocumentNumberLine(
  identity: DocumentIdentity,
  invoice: InvoiceLike | null | undefined = {},
): string {
  const operationalNumber = resolveOperationalDocumentNumber(invoice);

  if (identity.type === 'preorder') {
    return `${identity.title || 'PREVENTA'} #${
      identity.value ?? operationalNumber ?? '-'
    }`;
  }

  if (identity.type === 'receipt') {
    return `Recibo #${identity.value ?? operationalNumber ?? '-'}`;
  }

  if (identity.type === 'fiscal-credit-note') {
    return `Nota de crédito #${operationalNumber ?? identity.value ?? '-'}`;
  }

  if (identity.type === 'fiscal-debit-note') {
    return `Nota de débito #${operationalNumber ?? identity.value ?? '-'}`;
  }

  return `Factura #${operationalNumber ?? '-'}`;
}
