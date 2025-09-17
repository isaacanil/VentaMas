import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { getCashCountStrategy } from "../../notification/cashCountNotification/cashCountNotificacion";
import { submitInvoice, waitForInvoiceResult } from "./invoice.service";
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

  const processInvoice = useCallback(
    async (params) => {
      setLoading(true);
      setError(null);

      let submission = null;

      try {
        // Modo prueba: no toca backend real
        if (params?.isTestMode) {
          const testResult = await buildTestModeInvoice(params);
          return {
            invoice: testResult.invoice,
            invoiceId: testResult.invoiceId,
            invoiceMeta: { status: "test-preview", testMode: true },
            status: "test-preview",
            reused: false,
            idempotencyKey: null,
          };
        }

        const { signal, ...submissionPayload } = params || {};
        
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
        };
      } catch (err) {
        // Enriquecer el error con metadatos si alcanzamos a crear submission
        if (submission) {
          safeAssign(err, "invoiceId", submission.invoiceId);
          safeAssign(err, "idempotencyKey", submission.idempotencyKey);
          const reused =
            typeof submission.reused === "boolean" ? submission.reused : Boolean(submission.reused);
          if (typeof err.reused !== "boolean") {
            safeAssign(err, "reused", reused);
          }
        }

        // Detectar estado de cash count y disparar estrategia
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

        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  return {
    loading,
    error,
    processInvoice,
  };
}
