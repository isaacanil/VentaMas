export type InvoiceTemplateStorageKey =
  | 'template1'
  | 'template2'
  | 'template2_v2'
  | 'template2_v3'
  | 'template2_v3_1'
  | 'template2_v4'
  | 'template_paginated_dom'
  | 'template3'
  | 'template4';

export type InvoicePreviewTemplateKey = 'template1' | 'template2' | 'template4';
export type QuotationPreviewTemplateKey = 'template1' | 'template2';

export const DEFAULT_INVOICE_TEMPLATE_KEY: InvoiceTemplateStorageKey =
  'template1';
export const LETTER_INVOICE_TEMPLATE_KEY: InvoiceTemplateStorageKey =
  'template2';
export const LETTER_INVOICE_TEMPLATE_V2_KEY: InvoiceTemplateStorageKey =
  'template2_v2';
export const LETTER_INVOICE_TEMPLATE_V3_KEY: InvoiceTemplateStorageKey =
  'template2_v3';
export const LETTER_INVOICE_TEMPLATE_V3_1_KEY: InvoiceTemplateStorageKey =
  'template2_v3_1';
export const LETTER_INVOICE_TEMPLATE_V4_KEY: InvoiceTemplateStorageKey =
  'template2_v4';
export const PAGINATED_DOM_INVOICE_TEMPLATE_KEY: InvoiceTemplateStorageKey =
  'template_paginated_dom';
export const LEGACY_INVOICE_TEMPLATE_3_KEY: InvoiceTemplateStorageKey =
  'template3';
export const MATRIX_INVOICE_TEMPLATE_KEY: InvoiceTemplateStorageKey =
  'template4';

const INVOICE_TEMPLATE_KEYS = new Set<InvoiceTemplateStorageKey>([
  DEFAULT_INVOICE_TEMPLATE_KEY,
  LETTER_INVOICE_TEMPLATE_KEY,
  LETTER_INVOICE_TEMPLATE_V2_KEY,
  LETTER_INVOICE_TEMPLATE_V3_KEY,
  LETTER_INVOICE_TEMPLATE_V3_1_KEY,
  LETTER_INVOICE_TEMPLATE_V4_KEY,
  PAGINATED_DOM_INVOICE_TEMPLATE_KEY,
  LEGACY_INVOICE_TEMPLATE_3_KEY,
  MATRIX_INVOICE_TEMPLATE_KEY,
]);

export const DEPRECATED_INVOICE_TEMPLATE_KEYS = [
  LETTER_INVOICE_TEMPLATE_V2_KEY,
  LETTER_INVOICE_TEMPLATE_V3_KEY,
  LETTER_INVOICE_TEMPLATE_V3_1_KEY,
  LETTER_INVOICE_TEMPLATE_V4_KEY,
] as const satisfies readonly InvoiceTemplateStorageKey[];

const DEPRECATED_INVOICE_TEMPLATE_KEY_SET = new Set<InvoiceTemplateStorageKey>(
  DEPRECATED_INVOICE_TEMPLATE_KEYS,
);

export const resolveInvoiceSelectionTemplate = (
  value?: string | null,
): InvoiceTemplateStorageKey => {
  const normalizedValue = value?.trim().toLowerCase();

  return normalizedValue &&
    INVOICE_TEMPLATE_KEYS.has(normalizedValue as InvoiceTemplateStorageKey)
    ? (normalizedValue as InvoiceTemplateStorageKey)
    : DEFAULT_INVOICE_TEMPLATE_KEY;
};

export const resolveInvoicePreviewTemplate = (
  value?: string | null,
): InvoicePreviewTemplateKey => {
  switch (resolveInvoiceSelectionTemplate(value)) {
    case LETTER_INVOICE_TEMPLATE_KEY:
    case LETTER_INVOICE_TEMPLATE_V2_KEY:
    case LETTER_INVOICE_TEMPLATE_V3_KEY:
    case LETTER_INVOICE_TEMPLATE_V3_1_KEY:
    case LETTER_INVOICE_TEMPLATE_V4_KEY:
    case PAGINATED_DOM_INVOICE_TEMPLATE_KEY:
      return LETTER_INVOICE_TEMPLATE_KEY;
    case LEGACY_INVOICE_TEMPLATE_3_KEY:
      return DEFAULT_INVOICE_TEMPLATE_KEY;
    case MATRIX_INVOICE_TEMPLATE_KEY:
      return MATRIX_INVOICE_TEMPLATE_KEY;
    case DEFAULT_INVOICE_TEMPLATE_KEY:
    default:
      return DEFAULT_INVOICE_TEMPLATE_KEY;
  }
};

export const resolveQuotationPreviewTemplate = (
  value?: string | null,
): QuotationPreviewTemplateKey =>
  resolveInvoicePreviewTemplate(value) === LETTER_INVOICE_TEMPLATE_KEY
    ? LETTER_INVOICE_TEMPLATE_KEY
    : DEFAULT_INVOICE_TEMPLATE_KEY;

export const isLetterInvoiceTemplate = (value?: string | null): boolean =>
  resolveInvoicePreviewTemplate(value) === LETTER_INVOICE_TEMPLATE_KEY;

export const isInvoiceTemplateV2Beta = (value?: string | null): boolean =>
  resolveInvoiceSelectionTemplate(value) === LETTER_INVOICE_TEMPLATE_V2_KEY;

export const isInvoiceTemplateV4PdfMake = (value?: string | null): boolean =>
  resolveInvoiceSelectionTemplate(value) === LETTER_INVOICE_TEMPLATE_V4_KEY;

export const isPaginatedDomInvoiceTemplate = (value?: string | null): boolean =>
  resolveInvoiceSelectionTemplate(value) === PAGINATED_DOM_INVOICE_TEMPLATE_KEY;

export const isDeprecatedInvoiceTemplate = (value?: string | null): boolean =>
  DEPRECATED_INVOICE_TEMPLATE_KEY_SET.has(
    resolveInvoiceSelectionTemplate(value),
  );

export const resolveInvoiceReactPrintTemplate = (
  value?: string | null,
): InvoiceTemplateStorageKey =>
  isPaginatedDomInvoiceTemplate(value)
    ? LETTER_INVOICE_TEMPLATE_V3_1_KEY
    : resolveInvoiceSelectionTemplate(value);

export const isInvoiceTemplateV3Beta = (value?: string | null): boolean =>
  (
    [
      LETTER_INVOICE_TEMPLATE_V3_KEY,
      LETTER_INVOICE_TEMPLATE_V3_1_KEY,
      PAGINATED_DOM_INVOICE_TEMPLATE_KEY,
    ] as readonly InvoiceTemplateStorageKey[]
  ).includes(resolveInvoiceSelectionTemplate(value));

export const isProgrammaticLetterPdfTemplate = (
  value?: string | null,
): boolean => {
  switch (resolveInvoiceSelectionTemplate(value)) {
    case LETTER_INVOICE_TEMPLATE_KEY:
    case LETTER_INVOICE_TEMPLATE_V2_KEY:
    case LETTER_INVOICE_TEMPLATE_V4_KEY:
      return true;
    case LETTER_INVOICE_TEMPLATE_V3_KEY:
    case LETTER_INVOICE_TEMPLATE_V3_1_KEY:
    case PAGINATED_DOM_INVOICE_TEMPLATE_KEY:
    case LEGACY_INVOICE_TEMPLATE_3_KEY:
    case MATRIX_INVOICE_TEMPLATE_KEY:
    case DEFAULT_INVOICE_TEMPLATE_KEY:
    default:
      return false;
  }
};

export const getInvoiceTemplateSummaryLabel = (
  value?: string | null,
): string => {
  switch (resolveInvoiceSelectionTemplate(value)) {
    case LETTER_INVOICE_TEMPLATE_V2_KEY:
      return 'Carta V2 Beta (Deprecada)';
    case LETTER_INVOICE_TEMPLATE_V3_KEY:
      return 'Carta V3 HTML Beta (Deprecada)';
    case LETTER_INVOICE_TEMPLATE_V3_1_KEY:
      return 'Carta V3.1 HTML Beta (Deprecada)';
    case LETTER_INVOICE_TEMPLATE_V4_KEY:
      return 'Carta V4 PDFMake Beta (Deprecada)';
    case PAGINATED_DOM_INVOICE_TEMPLATE_KEY:
      return 'Carta paginada DOM';
    case LETTER_INVOICE_TEMPLATE_KEY:
      return 'Carta';
    case LEGACY_INVOICE_TEMPLATE_3_KEY:
      return 'Compacta legado';
    case MATRIX_INVOICE_TEMPLATE_KEY:
      return 'Compacta 2';
    case DEFAULT_INVOICE_TEMPLATE_KEY:
    default:
      return 'Compacta 1';
  }
};
