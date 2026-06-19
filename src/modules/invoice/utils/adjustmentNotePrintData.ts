import type { DebitNoteRecord } from '@/modules/invoice/types/debitNote';
import type { CreditNoteRecord } from '@/types/creditNote';
import type { InvoiceData, InvoiceProduct } from '@/types/invoice';
import { getTax, getTotalPrice } from '@/utils/pricing';

type AdjustmentNoteKind = 'creditNote' | 'debitNote';
type AdjustmentNoteRecord = CreditNoteRecord | DebitNoteRecord;

const DOCUMENT_TYPE_BY_KIND: Record<AdjustmentNoteKind, string> = {
  creditNote: 'E34',
  debitNote: 'E33',
};

const DOCUMENT_LABEL_BY_KIND: Record<AdjustmentNoteKind, string> = {
  creditNote: 'Nota de crédito',
  debitNote: 'Nota de débito',
};

const cleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
};

const toFiniteNumber = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const resolveNoteNcf = (note: AdjustmentNoteRecord): string | null =>
  cleanString(note.electronicTaxReceipt?.eNcf) ||
  cleanString(note.eNcf) ||
  cleanString(note.ncf);

const resolveDocumentTypeFromNcf = (ncf: string | null): string | null => {
  if (!ncf) return null;
  const compact = ncf.trim().toUpperCase();
  return compact.length >= 3 ? compact.slice(0, 3) : null;
};

const resolveDocumentType = (
  note: AdjustmentNoteRecord,
  kind: AdjustmentNoteKind,
): string => {
  const ncf = resolveNoteNcf(note);
  return (
    cleanString(note.electronicTaxReceipt?.documentType)?.toUpperCase() ||
    resolveDocumentTypeFromNcf(ncf) ||
    DOCUMENT_TYPE_BY_KIND[kind]
  );
};

const isElectronicNote = (
  note: AdjustmentNoteRecord,
  documentType: string,
  ncf: string | null,
): boolean =>
  documentType.startsWith('E') ||
  Boolean(ncf?.toUpperCase().startsWith('E')) ||
  note.documentFormat === 'electronic' ||
  note.fiscalMode === 'electronic_ecf' ||
  Boolean(note.electronicTaxReceipt);

const resolveProductsTotal = (products: InvoiceProduct[]): number =>
  roundMoney(
    products.reduce((sum, product) => sum + getTotalPrice(product, true), 0),
  );

const resolveProductsTax = (products: InvoiceProduct[]): number =>
  roundMoney(products.reduce((sum, product) => sum + getTax(product, true), 0));

const resolveTotalAmount = (
  note: AdjustmentNoteRecord,
  products: InvoiceProduct[],
): number => {
  const explicitTotal = toFiniteNumber(note.totalAmount);
  if (explicitTotal !== null && explicitTotal >= 0) {
    return roundMoney(explicitTotal);
  }

  return resolveProductsTotal(products);
};

const resolveTaxAmount = (
  note: AdjustmentNoteRecord,
  products: InvoiceProduct[],
): number => {
  const explicitTax = toFiniteNumber(
    (note as { taxAmount?: unknown }).taxAmount,
  );
  if (explicitTax !== null && explicitTax >= 0) {
    return roundMoney(explicitTax);
  }

  return resolveProductsTax(products);
};

const buildSyntheticProduct = ({
  kind,
  note,
  subtotal,
  tax,
}: {
  kind: AdjustmentNoteKind;
  note: AdjustmentNoteRecord;
  subtotal: number;
  tax: number;
}): InvoiceProduct | null => {
  const total = subtotal + tax;
  if (total <= 0) return null;

  const taxRate = subtotal > 0 ? roundMoney((tax / subtotal) * 100) : 0;
  const label = DOCUMENT_LABEL_BY_KIND[kind];

  return {
    id: `${kind}-${note.id ?? note.numberID ?? note.number ?? 'summary'}`,
    name: note.reason ? `${label}: ${note.reason}` : label,
    amountToBuy: 1,
    pricing: {
      price: subtotal,
      tax: taxRate,
    },
    selectedSaleUnit: {
      pricing: {
        price: subtotal,
        tax: taxRate,
      },
    },
  };
};

const resolvePrintableProducts = ({
  kind,
  note,
  subtotal,
  tax,
}: {
  kind: AdjustmentNoteKind;
  note: AdjustmentNoteRecord;
  subtotal: number;
  tax: number;
}): InvoiceProduct[] => {
  const products = Array.isArray(note.items) ? note.items : [];
  if (products.length > 0) return products;

  const syntheticProduct = buildSyntheticProduct({ kind, note, subtotal, tax });
  return syntheticProduct ? [syntheticProduct] : [];
};

const buildInvoiceComment = (
  note: AdjustmentNoteRecord,
  kind: AdjustmentNoteKind,
): string => {
  const affectedDocument =
    cleanString(note.invoiceNcf) ||
    (note.invoiceNumber != null ? `#${note.invoiceNumber}` : null);

  return [
    affectedDocument ? `Documento afectado: ${affectedDocument}` : null,
    note.reason ? `Motivo: ${note.reason}` : null,
    note.modificationCode
      ? `Código de modificación DGII: ${note.modificationCode}`
      : null,
    !affectedDocument && !note.reason ? DOCUMENT_LABEL_BY_KIND[kind] : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
};

const buildElectronicTaxReceipt = (
  note: AdjustmentNoteRecord,
  kind: AdjustmentNoteKind,
): InvoiceData['electronicTaxReceipt'] => {
  const ncf = resolveNoteNcf(note);
  const documentType = resolveDocumentType(note, kind);

  if (!isElectronicNote(note, documentType, ncf)) {
    return note.electronicTaxReceipt ?? null;
  }

  return {
    ...note.electronicTaxReceipt,
    documentType,
    eNcf: cleanString(note.electronicTaxReceipt?.eNcf) || ncf,
  };
};

const buildAdjustmentNotePrintData = (
  note: AdjustmentNoteRecord,
  kind: AdjustmentNoteKind,
): InvoiceData => {
  const ncf = resolveNoteNcf(note);
  const documentType = resolveDocumentType(note, kind);
  const electronicTaxReceipt = buildElectronicTaxReceipt(note, kind);
  const sourceProducts = Array.isArray(note.items) ? note.items : [];
  const total = resolveTotalAmount(note, sourceProducts);
  const tax = resolveTaxAmount(note, sourceProducts);
  const subtotal = roundMoney(Math.max(total - tax, 0));
  const products = resolvePrintableProducts({ kind, note, subtotal, tax });
  const isElectronic = isElectronicNote(note, documentType, ncf);

  return {
    id: note.id,
    numberID: note.numberID ?? note.number,
    number: note.number,
    NCF: ncf ?? undefined,
    comprobante: ncf ?? undefined,
    eNcf: isElectronic ? (ncf ?? undefined) : undefined,
    fiscalMode:
      note.fiscalMode ?? (isElectronic ? 'electronic_ecf' : undefined),
    documentFormat:
      note.documentFormat ?? (isElectronic ? 'electronic' : 'traditional'),
    electronicTaxReceipt,
    date: note.createdAt ?? note.updatedAt ?? null,
    client: note.client ?? null,
    products,
    paymentMethod: [],
    totalPurchase: { value: total },
    totalPurchaseWithoutTaxes: { value: subtotal },
    totalTaxes: { value: tax },
    totalShoppingItems: { value: products.length },
    delivery: { status: false, value: 0 },
    invoiceComment: buildInvoiceComment(note, kind),
    selectedTaxReceiptType: documentType,
    status: note.status,
    type: kind,
    documentKind: kind,
    affectedInvoiceId: note.invoiceId,
    affectedInvoiceNcf: note.invoiceNcf,
    affectedInvoiceNumber: note.invoiceNumber,
    affectedInvoiceDate: note.invoiceDate,
  };
};

export const creditNoteToInvoicePrintData = (
  note: CreditNoteRecord,
): InvoiceData => buildAdjustmentNotePrintData(note, 'creditNote');

export const debitNoteToInvoicePrintData = (
  note: DebitNoteRecord,
): InvoiceData => buildAdjustmentNotePrintData(note, 'debitNote');
