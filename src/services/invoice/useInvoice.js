import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { getCashCountStrategy } from "../../notification/cashCountNotification/cashCountNotificacion";
import {
  submitInvoice,
  waitForInvoiceResult,
  generateIdempotencyKey,
} from "./invoice.service";
import { GenericClient } from "../../features/clientCart/clientCartSlice";

const simulateDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildTestModeInvoice = async ({
  cart,
  client,
  taxReceiptEnabled,
  ncfType,
  dueDate,
  invoiceComment,
}) => {
  const now = Date.now();
  const mockNcfCode = taxReceiptEnabled ? `TEST-${ncfType || "NCF"}-${now}` : null;
  const mockClient = client && client.id ? client : GenericClient;

  const invoice = {
    ...cart,
    id: cart?.id || `TEST-INVOICE-${now}`,
    NCF: mockNcfCode,
    client: mockClient,
    cashCountId: "test-cash-count-id",
    createdAt: new Date(now).toISOString(),
    status: "test-preview",
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

const CASH_COUNT_REGEX = /cashcount[-\s]?(none|closing|closed)/i;

const safeAssign = (error, key, value) => {
  if (!error || value === undefined) return;
  try {
    if (error[key] === undefined) {
      error[key] = value;
    }
  } catch {
    // Algunos objetos de error (p. ej. DOMException) son inmutables.
  }
};

const extractCashCountState = (err) => {
  if (!err) return null;

  const rawSegments = [
    typeof err.message === "string" ? err.message : null,
    typeof err.details === "string" ? err.details : null,
    typeof err.code === "string" ? err.code : null,
  ].filter(Boolean);

  for (const segment of rawSegments) {
    const match = segment.match(CASH_COUNT_REGEX);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  }

  // Heurísticas en español
  const normalizedSegments = rawSegments.map((segment) => segment.toLowerCase());
  if (normalizedSegments.some((s) => s.includes("no hay cuadre de caja"))) return "none";
  if (normalizedSegments.some((s) => s.includes("cuadre de caja cerrado"))) return "closed";
  if (normalizedSegments.some((s) => s.includes("proceso de cierre"))) return "closing";

  return null;
};

export default function useInvoice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const shouldRetryWithFreshInvoice = (err) => {
    if (!err) return false;
    if (err.code !== "invoice-failed") return false;
    if (!err.reused) return false;
    const message = [err.message, err.failedTask?.lastError].filter(Boolean).join(" ");
    return /value for argument "seconds" is not a valid integer/i.test(message);
  };

  const performInvoiceAttempt = useCallback(
    async (params = {}, attemptLabel = "primary") => {
      let submission = null;

      const { signal, ...submissionPayload } = params;

      try {
        submission = await submitInvoice(submissionPayload);

        const result = await waitForInvoiceResult({
          businessId: submission.businessId,
          invoiceId: submission.invoiceId,
          signal,
        });

        return {
          invoice: result.invoice,
          invoiceMeta: result.invoiceMeta,
          canonical: result.canonical,
          invoiceId: submission.invoiceId,
          status: result.invoiceMeta?.status || submission.status || "pending",
          reused: Boolean(submission.reused),
          idempotencyKey: submission.idempotencyKey,
          attempt: attemptLabel,
        };
      } catch (err) {
        if (submission) {
          safeAssign(err, "invoiceId", submission.invoiceId);
          safeAssign(err, "idempotencyKey", submission.idempotencyKey);
          if (typeof err.reused !== "boolean") {
            safeAssign(err, "reused", Boolean(submission.reused));
          }
        }
        throw err;
      }
    },
    []
  );

  const processInvoice = useCallback(
    async (params) => {
      setLoading(true);
      setError(null);

      try {
        if (params?.isTestMode) {
          const testResult = await buildTestModeInvoice(params);
          return {
            invoice: testResult.invoice,
            invoiceId: testResult.invoiceId,
            invoiceMeta: { status: "test-preview", testMode: true },
            status: "test-preview",
            reused: false,
            idempotencyKey: null,
            attempt: "test",
          };
        }

        const firstAttempt = await performInvoiceAttempt(params, "primary");
        return firstAttempt;
      } catch (err) {
        const cashCountState = extractCashCountState(err);
        if (cashCountState) {
          const strategy = getCashCountStrategy(cashCountState, dispatch);
          strategy.handleConfirm();

          const formattedError = new Error("No se puede procesar la factura sin cuadre de caja");
          formattedError.code = `cashCount-${cashCountState}`;
          formattedError.invoiceId = err.invoiceId;
          formattedError.idempotencyKey = err.idempotencyKey;
          formattedError.reused = err.reused;
          formattedError.invoiceMeta = err.invoice || err.invoiceMeta || null;
          formattedError.originalError = err;

          setError(formattedError);
          throw formattedError;
        }

        if (shouldRetryWithFreshInvoice(err)) {
          try {
            const recoveryAttempt = await performInvoiceAttempt(
              {
                ...params,
                idempotencyKey: `recovery:${generateIdempotencyKey()}`,
              },
              "recovery"
            );
            return recoveryAttempt;
          } catch (recoveryError) {
            setError(recoveryError);
            throw recoveryError;
          }
        }

        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [dispatch, performInvoiceAttempt]
  );

  return {
    loading,
    error,
    processInvoice,
  };
}
