import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { GenericClient } from '@/features/clientCart/clientCartSlice';
import { getCashCountStrategy } from '@/notification/cashCountNotification/cashCountNotificacion';
import type { InvoiceData } from '@/types/invoice';

import {
  submitInvoice,
  waitForInvoiceResult,
  generateIdempotencyKey,
} from './invoice.service';
import type {
  InvoiceAttemptResult,
  InvoiceProcessParams,
  InvoiceServiceError,
  InvoiceSubmitResult,
  InvoiceWaitResult,
  UnknownRecord,
} from './types';

type CashCountState = 'none' | 'closed' | 'closing' | 'open';

type TestModeInvoiceParams = Pick<
  InvoiceProcessParams,
  'cart' | 'client' | 'taxReceiptEnabled' | 'ncfType' | 'dueDate' | 'invoiceComment'
>;

type TestModeInvoiceResult = {
  invoice: InvoiceData;
  invoiceId: string;
};

const simulateDelay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const buildTestModeInvoice = async ({
  cart,
  client,
  taxReceiptEnabled,
  ncfType,
  dueDate,
  invoiceComment,
}: TestModeInvoiceParams): Promise<TestModeInvoiceResult> => {
  const now = Date.now();
  const mockNcfCode = taxReceiptEnabled
    ? `TEST-${ncfType || 'NCF'}-${now}`
    : null;
  const clientLike = client as (UnknownRecord & { id?: string | number }) | null;
  const mockClient = clientLike?.id ? client : GenericClient;

  const invoice: InvoiceData = {
    ...(cart as UnknownRecord),
    id: cart?.id || `TEST-INVOICE-${now}`,
    NCF: mockNcfCode,
    client: mockClient,
    cashCountId: 'test-cash-count-id',
    createdAt: new Date(now).toISOString(),
    status: 'test-preview',
    timestamp: now,
    testMode: true,
  };

  if (dueDate) {
    invoice.dueDate = new Date(dueDate);
    invoice.hasDueDate = true;
  }

  if (invoiceComment) {
    invoice.invoiceComment = invoiceComment;
  }

  await simulateDelay(600);

  return {
    invoice,
    invoiceId: invoice.id,
  };
};

/** ---- Utilidades de manejo de errores / cash count ---- */

const CASH_COUNT_REGEX =
  /cash[\s_-]*count(?:[\s_-]*(?:status|state|is|=))?[\s_-]*([a-z_]+)/i;

const normalizeCashCountState = (
  rawState: string | null | undefined,
): CashCountState | null => {
  if (!rawState) return null;
  const normalized = rawState.replace(/[^a-z]/gi, '').toLowerCase();
  if (!normalized) return null;

  if (
    normalized === 'none' ||
    normalized.startsWith('noopen') ||
    normalized.startsWith('notfound') ||
    normalized.startsWith('notopen') ||
    normalized.startsWith('missing') ||
    normalized.startsWith('absent') ||
    normalized.startsWith('without') ||
    normalized.startsWith('undefined')
  ) {
    return 'none';
  }
  if (normalized.startsWith('closing')) {
    return 'closing';
  }
  if (normalized.startsWith('closed') || normalized === 'close') {
    return 'closed';
  }
  if (normalized.startsWith('open')) {
    return 'open';
  }

  return null;
};

const safeAssign = (error: unknown, key: string, value: unknown): void => {
  if (!error || value === undefined || typeof error !== 'object') return;
  try {
    const target = error as Record<string, unknown>;
    if (target[key] === undefined) {
      target[key] = value;
    }
  } catch {
    // Algunos objetos de error (p. ej. DOMException) son inmutables.
  }
};

const extractCashCountState = (err: unknown): CashCountState | null => {
  if (!err || typeof err !== 'object') return null;
  const error = err as {
    message?: unknown;
    details?: unknown;
    code?: unknown;
  };

  const rawSegments = [
    typeof error.message === 'string' ? error.message : null,
    typeof error.details === 'string' ? error.details : null,
    typeof error.code === 'string' ? error.code : null,
  ].filter(Boolean);

  for (const segment of rawSegments) {
    const match = segment.match(CASH_COUNT_REGEX);
    if (match && match[1]) {
      const normalized = normalizeCashCountState(match[1]);
      if (normalized) {
        return normalized;
      }
    }
  }

  // Heurísticas en español
  const normalizedSegments = rawSegments.map((segment) =>
    segment.toLowerCase(),
  );
  if (normalizedSegments.some((s) => s.includes('no hay cuadre de caja')))
    return 'none';
  if (normalizedSegments.some((s) => s.includes('cuadre de caja cerrado')))
    return 'closed';
  if (normalizedSegments.some((s) => s.includes('proceso de cierre')))
    return 'closing';

  return null;
};

export default function useInvoice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<InvoiceServiceError | null>(null);
  const dispatch = useDispatch();

  const shouldRetryWithFreshInvoice = (err: InvoiceServiceError | null) => {
    if (!err) return false;
    if (err.code !== 'invoice-failed') return false;
    if (!err.reused) return false;
    const message = [err.message, err.failedTask?.lastError]
      .filter(Boolean)
      .join(' ');
    return /value for argument "seconds" is not a valid integer/i.test(message);
  };

  const performInvoiceAttempt = useCallback(
    async (
      params: InvoiceProcessParams = {},
      attemptLabel = 'primary',
    ): Promise<InvoiceAttemptResult> => {
      let submission: InvoiceSubmitResult | null = null;

      const { signal, ...submissionPayload } = params;

      try {
        submission = await submitInvoice(submissionPayload);

        const result: InvoiceWaitResult = await waitForInvoiceResult({
          businessId: submission.businessId,
          invoiceId: submission.invoiceId,
          signal,
        });

        return {
          invoice: result.invoice,
          invoiceMeta: result.invoiceMeta,
          canonical: result.canonical,
          invoiceId: submission.invoiceId,
          status: result.invoiceMeta?.status || submission.status || 'pending',
          reused: Boolean(submission.reused),
          idempotencyKey: submission.idempotencyKey,
          attempt: attemptLabel,
        };
      } catch (err) {
        const errObj = err as InvoiceServiceError;
        if (submission) {
          safeAssign(errObj, 'invoiceId', submission.invoiceId);
          safeAssign(errObj, 'idempotencyKey', submission.idempotencyKey);
          if (typeof errObj.reused !== 'boolean') {
            safeAssign(errObj, 'reused', Boolean(submission.reused));
          }
        }
        throw err;
      }
    },
    [],
  );

  const processInvoice = useCallback(
    async (params: InvoiceProcessParams): Promise<InvoiceAttemptResult> => {
      setLoading(true);
      setError(null);

      try {
        if (params?.isTestMode) {
          const testResult = await buildTestModeInvoice(params);
          return {
            invoice: testResult.invoice,
            invoiceId: testResult.invoiceId,
            invoiceMeta: { status: 'test-preview', testMode: true },
            status: 'test-preview',
            reused: false,
            idempotencyKey: null,
            attempt: 'test',
          };
        }

        const firstAttempt = await performInvoiceAttempt(params, 'primary');
        return firstAttempt;
      } catch (err) {
        const cashCountState = extractCashCountState(err);
        if (cashCountState) {
          const strategy = getCashCountStrategy(cashCountState, dispatch);
          strategy.handleConfirm();

          const invoiceError = err as InvoiceServiceError;
          const formattedError: InvoiceServiceError = Object.assign(
            new Error('No se puede procesar la factura sin cuadre de caja'),
            {
              code: `cashCount-${cashCountState}`,
              invoiceId: invoiceError.invoiceId,
              idempotencyKey: invoiceError.idempotencyKey,
              reused: invoiceError.reused,
              invoiceMeta:
                invoiceError.invoice || invoiceError.invoiceMeta || null,
              originalError: err,
            },
          );

          setError(formattedError);
          throw formattedError;
        }

        if (shouldRetryWithFreshInvoice(err as InvoiceServiceError)) {
          try {
            const recoveryAttempt = await performInvoiceAttempt(
              {
                ...params,
                idempotencyKey: `recovery:${generateIdempotencyKey()}`,
              },
              'recovery',
            );
            return recoveryAttempt;
          } catch (recoveryError) {
            setError(recoveryError as InvoiceServiceError);
            throw recoveryError;
          }
        }

        setError(err as InvoiceServiceError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [dispatch, performInvoiceAttempt],
  );

  return {
    loading,
    error,
    processInvoice,
  };
}
