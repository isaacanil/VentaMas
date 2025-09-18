import { httpsCallable } from "firebase/functions";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { nanoid } from "nanoid";
import { functions, db } from "../../firebase/firebaseconfig";

const createInvoiceCallable = httpsCallable(functions, "createInvoiceV2");

const DEFAULT_POLL_INTERVAL_MS = 700;
const DEFAULT_TIMEOUT_MS = 45000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isPlainObject = (value) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};

const sanitizeNumericValues = (input) => {
    if (Array.isArray(input)) {
        return input.map(sanitizeNumericValues);
    }

    if (isPlainObject(input)) {
        return Object.entries(input).reduce((acc, [key, value]) => {
            acc[key] = sanitizeNumericValues(value);
            return acc;
        }, {});
    }

    if (typeof input === "number") {
        return Number.isFinite(input) ? input : null;
    }

    return input;
};

const normalizeUser = (user) => {
    if (!user) return null;
    const businessId = user.businessID || user.businessId || user.business?.id || user.business?.businessID || null;
    const uid = user.uid || user.id || user.userId || user.user_id || user.uuid || null;
    return {
        uid,
        businessID: businessId,
    };
};

const normalizeNcf = ({ taxReceiptEnabled, ncfType, ncf }) => {
    const enabled = Boolean(taxReceiptEnabled || (ncf && ncf.enabled));
    const type = ncf?.type || ncfType || null;
    if (!enabled) {
        return { enabled: false, type: null };
    }
    return { enabled: true, type };
};

export const generateIdempotencyKey = () => nanoid(21);

export const buildInvoiceRequestPayload = ({
    user,
    userId,
    business,
    businessId,
    cart,
    client,
    accountsReceivable,
    insuranceAR,
    insuranceAuth,
    insuranceEnabled,
    taxReceiptEnabled,
    ncfType,
    ncf,
    dueDate,
    invoiceComment,
    insurance,
    preorder,
    idempotencyKey,
    isTestMode,
}) => {
    const normalizedUser = normalizeUser(user);
    const resolvedBusinessId = businessId
        || business?.id
        || business?.businessID
        || normalizedUser?.businessID
        || null;
    const resolvedUserId = userId || normalizedUser?.uid || null;

    const payload = {
        idempotencyKey,
        businessId: resolvedBusinessId,
        userId: resolvedUserId,
        cart: cart ?? null,
        client: client ?? null,
        accountsReceivable: accountsReceivable ?? null,
        insuranceAR: insuranceAR ?? null,
        insuranceAuth: insuranceAuth ?? null,
        insuranceEnabled: Boolean(insuranceEnabled),
        taxReceiptEnabled: Boolean(taxReceiptEnabled),
        ncfType: ncfType ?? null,
        dueDate: typeof dueDate === "number" ? dueDate : dueDate ? Number(dueDate) : null,
        invoiceComment: invoiceComment ?? null,
        insurance: insurance ?? {
            enabled: Boolean(insuranceEnabled),
            AR: insuranceAR ?? null,
            auth: insuranceAuth ?? null,
        },
        preorder: preorder ?? (cart?.preorderDetails ? { ...cart.preorderDetails } : undefined),
        ncf: normalizeNcf({ taxReceiptEnabled, ncfType, ncf }),
        isTestMode: Boolean(isTestMode),
    };

    if (normalizedUser) {
        payload.user = normalizedUser;
    }

    if (!payload.businessId) {
        throw new Error("businessId es requerido para iniciar la factura");
    }

    if (!payload.userId) {
        throw new Error("userId es requerido para iniciar la factura");
    }

    return sanitizeNumericValues(payload);
};

export const submitInvoice = async (params) => {
    const idempotencyKey = params?.idempotencyKey || generateIdempotencyKey();
    const payload = buildInvoiceRequestPayload({ ...params, idempotencyKey });

    const { data } = await createInvoiceCallable(payload);

    return {
        ...data,
        idempotencyKey,
        businessId: payload.businessId,
        userId: payload.userId,
    };
};

const fetchFailedTask = async ({ businessId, invoiceId }) => {
    const outboxRef = collection(db, `businesses/${businessId}/invoicesV2/${invoiceId}/outbox`);
    const failedQuery = query(outboxRef, where("status", "==", "failed"), limit(1));
    const failedSnap = await getDocs(failedQuery);
    if (failedSnap.empty) return null;
    const docSnap = failedSnap.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
};

export const waitForInvoiceResult = async ({
    businessId,
    invoiceId,
    signal,
    pollInterval = DEFAULT_POLL_INTERVAL_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
}) => {
    if (!businessId) {
        throw new Error("businessId es requerido para consultar la factura");
    }
    if (!invoiceId) {
        throw new Error("invoiceId es requerido para consultar la factura");
    }

    const invoiceRef = doc(db, `businesses/${businessId}/invoicesV2/${invoiceId}`);
    const canonicalRef = doc(db, `businesses/${businessId}/invoices/${invoiceId}`);

    const startedAt = Date.now();
    let lastSnapshot = null;

    while (true) {
        if (signal?.aborted) {
            throw new DOMException("La consulta de factura fue cancelada", "AbortError");
        }

        const invoiceSnap = await getDoc(invoiceRef);
        const invoiceData = invoiceSnap.exists() ? invoiceSnap.data() : null;
        if (invoiceData) {
            lastSnapshot = invoiceData;
            if (invoiceData.status === "failed") {
                const failedTask = await fetchFailedTask({ businessId, invoiceId });
                const errorMessage = failedTask?.lastError
                    || (failedTask?.type ? `La tarea ${failedTask.type} falló durante el procesamiento.` : "El proceso de factura falló.");
                const error = new Error(errorMessage);
                error.code = "invoice-failed";
                error.invoice = invoiceData;
                error.failedTask = failedTask;
                throw error;
            }

            if (invoiceData.status === "committed") {
                const canonicalSnap = await getDoc(canonicalRef);
                if (canonicalSnap.exists()) {
                    const canonicalData = canonicalSnap.data();
                    return {
                        invoice: canonicalData?.data ?? null,
                        canonical: canonicalData ?? null,
                        invoiceMeta: invoiceData,
                    };
                }
            }
        }

        if (Date.now() - startedAt >= timeoutMs) {
            const timeoutError = new Error("Tiempo de espera agotado al confirmar la factura. Verifica el estado en el historial de facturación.");
            timeoutError.code = "invoice-timeout";
            timeoutError.invoice = lastSnapshot;
            throw timeoutError;
        }

        await delay(pollInterval);
    }
};
