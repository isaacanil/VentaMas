import type { InvoiceProcessPhaseTrace } from '@/services/invoice/types';
import { measure } from '@/utils/perf/measure';

type CartLike = Record<string, unknown> | null | undefined;
type TracePrimitive = boolean | number | string | null;
type TraceMeta = Record<string, unknown>;

export type InvoiceSubmitTracePhase =
  | 'inicio'
  | 'validaciones previas'
  | 'runInvoice/createInvoiceV2'
  | 'waitForInvoiceResult'
  | 'impresion'
  | 'cleanup';

export type InvoiceSubmitTraceStatus =
  | 'started'
  | 'completed'
  | 'blocked'
  | 'failed'
  | 'skipped'
  | 'deferred';

export type InvoiceSubmitTraceContext = {
  cartLineCount: number | null;
  electronicTaxReceiptModelEnabled: boolean;
  hasCartReference: boolean;
  hasClient: boolean;
  hasMonetaryContext: boolean;
  isReceivable: boolean;
  serviceCommissionsConfigured: boolean;
  shouldPrintInvoice: boolean;
  taxReceiptEnabled: boolean;
  testMode: boolean;
};

const getCartLineCount = (cart: CartLike): number | null => {
  const products = cart?.products;
  return Array.isArray(products) ? products.length : null;
};

const hasCartReference = (cart: CartLike): boolean =>
  Boolean(cart?.id || cart?.cartId || cart?.cartIdRef);

export const buildInvoiceSubmitTraceContext = ({
  cart,
  client,
  electronicTaxReceiptModelEnabled,
  isTestMode,
  monetaryContext,
  serviceCommissions,
  shouldPrintInvoice,
  taxReceiptEnabled,
}: {
  cart: CartLike;
  client: Record<string, unknown> | null;
  electronicTaxReceiptModelEnabled: boolean;
  isTestMode: boolean;
  monetaryContext?: unknown;
  serviceCommissions?: unknown;
  shouldPrintInvoice: boolean;
  taxReceiptEnabled: boolean;
}): InvoiceSubmitTraceContext => ({
  cartLineCount: getCartLineCount(cart),
  electronicTaxReceiptModelEnabled: Boolean(electronicTaxReceiptModelEnabled),
  hasCartReference: hasCartReference(cart),
  hasClient: Boolean(client),
  hasMonetaryContext: Boolean(monetaryContext),
  isReceivable: Boolean(cart?.isAddedToReceivables),
  serviceCommissionsConfigured: Boolean(serviceCommissions),
  shouldPrintInvoice: Boolean(shouldPrintInvoice),
  taxReceiptEnabled: Boolean(taxReceiptEnabled),
  testMode: Boolean(isTestMode),
});

const toTracePrimitive = (value: unknown): TracePrimitive => {
  if (value == null) return null;
  if (typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  return '[redacted]';
};

const sanitizeTraceMeta = (meta: TraceMeta): Record<string, TracePrimitive> =>
  Object.entries(meta).reduce<Record<string, TracePrimitive>>(
    (acc, [key, value]) => {
      acc[key] = toTracePrimitive(value);
      return acc;
    },
    {},
  );

const resolveTraceErrorMeta = (error: unknown): TraceMeta => {
  const errorRecord =
    error && typeof error === 'object'
      ? (error as Record<string, unknown>)
      : {};
  return {
    errorCode:
      typeof errorRecord.code === 'string' ? errorRecord.code : null,
    errorName:
      error instanceof Error
        ? error.name
        : typeof errorRecord.name === 'string'
          ? errorRecord.name
          : null,
  };
};

const getMeasureLabel = (phase: InvoiceSubmitTracePhase): string =>
  `InvoicePanel.submit.${phase.replace(/\s+/g, '-')}`;

export const traceInvoiceSubmitPhase = (
  phase: InvoiceSubmitTracePhase,
  status: InvoiceSubmitTraceStatus,
  context: InvoiceSubmitTraceContext,
  meta: TraceMeta = {},
): void => {
  console.info(`[InvoicePanel] submit.${phase} -> ${status}`, {
    phase,
    status,
    ...context,
    ...sanitizeTraceMeta(meta),
  });
};

export const measureInvoiceSubmitPhase = async <T,>(
  phase: InvoiceSubmitTracePhase,
  context: InvoiceSubmitTraceContext,
  fn: () => Promise<T> | T,
  meta: TraceMeta = {},
): Promise<T> => {
  traceInvoiceSubmitPhase(phase, 'started', context, meta);
  try {
    const result = (await measure(getMeasureLabel(phase), fn)) as T;
    traceInvoiceSubmitPhase(phase, 'completed', context, meta);
    return result;
  } catch (error) {
    traceInvoiceSubmitPhase(phase, 'failed', context, {
      ...meta,
      ...resolveTraceErrorMeta(error),
    });
    throw error;
  }
};

const mapProcessPhaseToSubmitPhase = (
  phase: InvoiceProcessPhaseTrace['phase'],
): InvoiceSubmitTracePhase => {
  if (phase === 'waitForInvoiceResult') return 'waitForInvoiceResult';
  return 'runInvoice/createInvoiceV2';
};

export const traceInvoiceProcessPhase = (
  trace: InvoiceProcessPhaseTrace,
  context: InvoiceSubmitTraceContext,
): void => {
  traceInvoiceSubmitPhase(mapProcessPhaseToSubmitPhase(trace.phase), trace.status, context, {
    attempt: trace.attempt ?? null,
    errorCode: trace.errorCode ?? null,
    errorName: trace.errorName ?? null,
    hasInvoice: trace.hasInvoice ?? null,
    invoiceStatus: trace.invoiceStatus ?? null,
    reused: trace.reused ?? null,
    sourcePhase: trace.phase,
  });
};
