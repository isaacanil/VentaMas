const RECEIPT_MAP = {
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

const RECEIPT_FALLBACK = {
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

export const isPreorderDocument = (invoice = {}, { rawNcf } = {}) => {
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

  const status = invoice?.status ?? 'pending';
  if (status === 'completed') {
    return false;
  }

  return (
    PREORDER_ACTIVE_STATUSES.has(status) ||
    (!invoice?.status && isExplicitPreorder)
  );
};

export function resolveDocumentIdentity(invoice = {}) {
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
      value: preorderNumber,
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
