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

export const isPreorderDocument = (invoice = {}) =>
    invoice?.type === 'preorder' || invoice?.preorderDetails?.isOrWasPreorder;

export function resolveDocumentIdentity(invoice = {}) {
    const isPreorder = isPreorderDocument(invoice);
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

    const rawNcf = (invoice?.NCF || invoice?.comprobante || '').toString().trim();

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
