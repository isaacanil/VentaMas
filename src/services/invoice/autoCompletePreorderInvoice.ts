/**
 * Auto-completes a preorder by converting it into an invoice
 * when the last CxC payment brings the balance to 0.
 *
 * This bypasses InvoicePanel and calls `createInvoiceV2` directly.
 */
import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { checkOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { flowTrace } from '@/utils/flowTrace';
import type { InvoiceData } from '@/types/invoice';

import {
  submitInvoice,
  waitForInvoiceResult,
  generateIdempotencyKey,
} from './invoice.service';

type AutoCompleteClient = {
  id?: string | null;
  name?: string | null;
  [key: string]: unknown;
};

type AutoCompleteParams = {
  businessId: string;
  userId: string;
  preorderId: string;
  client?: AutoCompleteClient | null;
  /** Tax receipt settings (NCF). Pass null/false to skip. */
  taxReceiptEnabled?: boolean;
  ncfType?: string | null;
  /** The selected tax receipt type stored in the preorder. */
  preorderTaxReceiptType?: string | null;
  isTestMode?: boolean;
};

type AutoCompleteResult = {
  success: boolean;
  invoice?: InvoiceData | null;
  invoiceId?: string;
  error?: string;
  errorCode?: string;
};

type CallableErrorDetails = {
  message?: unknown;
  traceId?: unknown;
  reason?: unknown;
};

const extractCallableErrorDetails = (
  error: unknown,
): {
  message: string | null;
  reason: string | null;
  traceId: string | null;
} => {
  const defaultMessage =
    error instanceof Error ? error.message : 'Error desconocido';
  const details =
    error && typeof error === 'object' && 'details' in error
      ? (error as { details?: unknown }).details
      : null;

  if (!details || typeof details !== 'object') {
    return {
      message: defaultMessage,
      reason: null,
      traceId: null,
    };
  }

  const parsedDetails = details as CallableErrorDetails;
  const detailsMessage =
    typeof parsedDetails.message === 'string'
      ? parsedDetails.message
      : defaultMessage;
  const reason =
    typeof parsedDetails.reason === 'string' ? parsedDetails.reason : null;
  const traceId =
    typeof parsedDetails.traceId === 'string' ? parsedDetails.traceId : null;

  return {
    message: detailsMessage,
    reason,
    traceId,
  };
};

const isNcfUnavailableError = ({
  message,
  reason,
}: {
  message: string | null;
  reason: string | null;
}) => {
  if (reason === 'ncf-unavailable') return true;
  if (!message) return false;

  const normalized = message.toLowerCase();
  return (
    normalized.includes('cantidad insuficiente') ||
    normalized.includes('no hay comprobantes disponibles') ||
    normalized.includes('no se pudo encontrar un ncf')
  );
};

/**
 * Resolves the tax receipt type from the preorder data.
 */
const resolvePreorderTaxReceiptType = (
  preorder: InvoiceData | null | undefined,
): string | null =>
  preorder?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.taxReceipt?.type ??
  null;

/**
 * Builds the cart payload for `createInvoiceV2` when the preorder was fully
 * paid via Accounts Receivable (CxC).
 *
 * Business rule: invoice.paymentMethod is a POS snapshot at the moment of issuing
 * the invoice. AR payments must not overwrite or fake POS payment methods.
 */
const buildCartForReceivableAutoComplete = (cart: InvoiceData): InvoiceData => {
  return {
    ...cart,
    // Ensure the invoice is emitted without POS payment snapshot.
    paymentMethod: [],
    payment: { ...(cart.payment ?? {}), value: 0 },
    change: { ...(cart.change ?? {}), value: 0 },
    payWith: { ...(cart.payWith ?? {}), value: 0 },
    // Keep the CF from trying to create a new AR. Existing AR already handled the payments.
    isAddedToReceivables: false,
    // Flag for analytics/UI/cash reconciliation (frontend-only consumers can use this).
    collectedViaReceivables: true,
  };
};

const resolveClientFallback = (
  cart: InvoiceData | null,
  fallbackClient?: AutoCompleteClient | null,
): AutoCompleteClient | null => {
  const cartClient =
    cart && typeof cart.client === 'object' && cart.client !== null
      ? (cart.client as AutoCompleteClient)
      : null;
  const fallback =
    fallbackClient && typeof fallbackClient === 'object'
      ? fallbackClient
      : null;

  if (cartClient && fallback) {
    return {
      ...fallback,
      ...cartClient,
      id: cartClient.id ?? fallback.id ?? null,
      name: cartClient.name ?? fallback.name ?? null,
    };
  }

  return cartClient ?? fallback ?? null;
};

/**
 * Reads the preorder document from Firestore and converts it
 * to the cart-like InvoiceData the Cloud Function expects.
 */
const loadPreorderAsCart = async (
  businessId: string,
  preorderId: string,
): Promise<InvoiceData | null> => {
  const invoiceRef = doc(
    db,
    'businesses',
    businessId,
    'invoices',
    preorderId,
  );
  const snap = await getDoc(invoiceRef);
  if (!snap.exists()) return null;

  const docData = snap.data() as { data?: InvoiceData };
  const preorderData = docData?.data ?? (docData as unknown as InvoiceData);

  if (!preorderData) return null;

  // Ensure products exist
  if (!Array.isArray(preorderData.products) || preorderData.products.length === 0) {
    return null;
  }

  const normalizedProducts = Array.isArray(preorderData.products)
    ? preorderData.products.filter(
        (product) =>
          product &&
          typeof product === 'object' &&
          Number((product as { amountToBuy?: unknown }).amountToBuy) > 0,
      )
    : [];

  if (!normalizedProducts.length) {
    return null;
  }

  return {
    ...preorderData,
    id: preorderData.id ?? preorderId,
    products: normalizedProducts,
  };
};

/**
 * Auto-completes a preorder invoice without opening InvoicePanel.
 *
 * 1. Reads the preorder from Firestore
 * 2. Builds the Cloud Function payload
 * 3. Calls `createInvoiceV2` and polls until ready
 * 4. Returns the created invoice
 */
export const autoCompletePreorderInvoice = async (
  params: AutoCompleteParams,
): Promise<AutoCompleteResult> => {
  const {
    businessId,
    userId,
    preorderId,
    client: clientFallback = null,
    taxReceiptEnabled = false,
    ncfType: ncfTypeOverride = null,
    preorderTaxReceiptType: preorderTaxReceiptTypeOverride = null,
    isTestMode = false,
  } = params;

  try {
    void flowTrace('PREORDER_AUTO_COMPLETE_START', { preorderId, businessId });

    // 1. Load preorder from Firestore
    const cart = await loadPreorderAsCart(businessId, preorderId);
    if (!cart) {
      void flowTrace('PREORDER_AUTO_COMPLETE_NO_DATA', { preorderId });
      return {
        success: false,
        error: 'No se encontró la preventa o no tiene productos.',
      };
    }

    // 1b. Verify there is an open cash count before calling the CF
    try {
      const { state } = await checkOpenCashReconciliation({
        businessID: businessId,
        uid: userId,
      });
      if (state !== 'open') {
        void flowTrace('PREORDER_AUTO_COMPLETE_NO_CASH_COUNT', {
          preorderId,
          cashCountState: state,
        });
        return {
          success: false,
          error:
            state === 'closing'
              ? 'El cuadre de caja está en proceso de cierre. Espera a que termine o abre uno nuevo para completar la preventa.'
              : 'No hay un cuadre de caja abierto. Abre uno para poder generar la factura de esta preventa.',
        };
      }
    } catch (ccError) {
      void flowTrace('PREORDER_AUTO_COMPLETE_CASH_COUNT_ERROR', {
        preorderId,
        error:
          ccError instanceof Error ? ccError.message : String(ccError),
      });
      return {
        success: false,
        error:
          'No se pudo verificar el cuadre de caja. Abre uno y completa la preventa manualmente.',
      };
    }

    // 2. Resolve tax receipt type
    const storedTaxReceiptType =
      preorderTaxReceiptTypeOverride ?? resolvePreorderTaxReceiptType(cart);
    const effectiveNcfType = ncfTypeOverride ?? storedTaxReceiptType;

    // 3. Resolve client
    const client = resolveClientFallback(cart, clientFallback);

    // 4. Build idempotency key from the preorder id to prevent duplicates
    const idempotencyKey = `auto-complete:${preorderId}:${generateIdempotencyKey()}`;

    // 5. Build preorder details for the CF
    const preorder = cart.preorderDetails
      ? { ...cart.preorderDetails }
      : undefined;

    // 6. Extract invoice comments from products
    const invoiceComment = Array.isArray(cart.products)
      ? cart.products
          .filter((p) => p.comment)
          .map((p) => `${p.name}: ${p.comment}`)
          .join('; ') || null
      : null;

    void flowTrace('PREORDER_AUTO_COMPLETE_SUBMIT', {
      preorderId,
      idempotencyKey,
      taxReceiptEnabled,
      ncfType: effectiveNcfType,
      hasClientId: Boolean(client?.id),
    });

    // 7. Submit to Cloud Function
    const submission = await submitInvoice({
      cart: {
        ...buildCartForReceivableAutoComplete(cart),
      },
      user: { uid: userId, businessID: businessId },
      client,
      accountsReceivable: null,
      taxReceiptEnabled,
      ncfType: taxReceiptEnabled ? effectiveNcfType : null,
      dueDate: null,
      insuranceEnabled: false,
      insuranceAR: null,
      insuranceAuth: null,
      invoiceComment,
      isTestMode,
      businessId,
      idempotencyKey,
      preorder,
    });

    // 8. Wait for Cloud Function to finish processing
    const result = await waitForInvoiceResult({
      businessId: submission.businessId,
      invoiceId: submission.invoiceId,
    });

    const createdInvoice = result?.invoice ?? null;

    void flowTrace('PREORDER_AUTO_COMPLETE_SUCCESS', {
      preorderId,
      invoiceId: submission.invoiceId,
      status: submission.status,
    });

    return {
      success: true,
      invoice: createdInvoice,
      invoiceId: submission.invoiceId,
    };
  } catch (error) {
    const { message, reason, traceId } = extractCallableErrorDetails(error);
    const ncfUnavailable = isNcfUnavailableError({ message, reason });
    const errorCode = ncfUnavailable ? 'ncf-unavailable' : 'unknown';
    const errorMessage = ncfUnavailable
      ? 'No tienes más números disponibles para este comprobante fiscal. Selecciona otro comprobante y vuelve a finalizar la preventa para generar la factura.'
      : message || 'Error desconocido';
    const composedError =
      traceId && !ncfUnavailable
        ? `${errorMessage} (traceId: ${traceId})`
        : errorMessage;

    void flowTrace('PREORDER_AUTO_COMPLETE_ERROR', {
      preorderId,
      errorCode,
      error: composedError,
    });

    console.error(
      '[autoCompletePreorderInvoice] Failed to auto-complete preorder:',
      {
        preorderId,
        businessId,
        error: composedError,
      },
    );

    return {
      success: false,
      error: composedError,
      errorCode,
    };
  }
};
