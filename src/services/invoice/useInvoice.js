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

const extractCashCountState = (err) => {
    if (!err) return null;
    const segments = [err.message, typeof err.details === "string" ? err.details : null]
        .filter(Boolean)
        .join(" ");
    const match = segments.match(/cashCount-(none|closing|closed)/);
    if (!match) return null;
    const [, state] = match[0].split("-");
    return state || "none";
};

export default function useInvoice() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const dispatch = useDispatch();

    const processInvoice = useCallback(async (params) => {
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
                };
            }

            const { signal, ...submissionPayload } = params || {};
            const submission = await submitInvoice(submissionPayload);
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
            const cashCountState = extractCashCountState(err);
            if (cashCountState) {
                const strategy = getCashCountStrategy(cashCountState, dispatch);
                strategy.handleConfirm();
                const formattedError = new Error("No se puede procesar la factura sin cuadre de caja");
                formattedError.code = `cashCount-${cashCountState}`;
                setError(formattedError);
                throw formattedError;
            }

            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    return {
        loading,
        error,
        processInvoice,
    };
}
