import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { nanoid } from 'nanoid';

import { functions, db } from '../../firebase/firebaseconfig';

const createInvoiceCallable = httpsCallable(functions, 'createInvoiceV2');

const DEFAULT_POLL_INTERVAL_MS = 700;
const DEFAULT_TIMEOUT_MS = 45000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isPlainObject = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const sanitizeNumericValues = (input) => {
  if (input === undefined) {
    return null;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeNumericValues);
  }

  if (isPlainObject(input)) {
    return Object.entries(input).reduce((acc, [key, value]) => {
      acc[key] = sanitizeNumericValues(value);
      return acc;
    }, {});
  }

  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }

  return input;
};

const normalizeCart = (cart) => {
  if (cart == null || typeof cart !== 'object') {
    return cart ?? null;
  }

  const normalizedCart = { ...cart };

  if (Array.isArray(cart.products)) {
    normalizedCart.products = cart.products.map((product) => {
      if (product == null || typeof product !== 'object') {
        return product ?? null;
      }

      const normalizedProduct = { ...product };
      if (normalizedProduct.productStockId === undefined) {
        normalizedProduct.productStockId = null;
      }
      if (normalizedProduct.batchId === undefined) {
        normalizedProduct.batchId = null;
      }
      return normalizedProduct;
    });
  }

  return normalizedCart;
};

const normalizeUser = (user) => {
  if (!user) return null;
  const businessId =
    user.businessID ||
    user.businessId ||
    user.business?.id ||
    user.business?.businessID ||
    null;
  const uid =
    user.uid || user.id || user.userId || user.user_id || user.uuid || null;
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

const toMilliseconds = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) ? millis : null;
  }

  if (typeof value?.toMillis === 'function') {
    const millis = value.toMillis();
    return Number.isFinite(millis) ? millis : null;
  }

  if (typeof value === 'object') {
    const seconds = value?.seconds ?? value?._seconds;
    const nanos =
      value?.nanoseconds ??
      value?.nanosecond ??
      value?._nanoseconds ??
      value?.nanoSeconds ??
      value?.nanos ??
      0;

    if (Number.isFinite(seconds)) {
      const secondsNumber = Number(seconds);
      if (Number.isFinite(secondsNumber)) {
        const nanosNumber = Number(nanos);
        if (Number.isFinite(nanosNumber)) {
          return secondsNumber * 1000 + Math.floor(nanosNumber / 1e6);
        }
      }
    }

    if (typeof value.valueOf === 'function') {
      const raw = value.valueOf();
      if (typeof raw === 'number') {
        return Number.isFinite(raw) ? raw : null;
      }
      const numeric = Number(raw);
      return Number.isFinite(numeric) ? numeric : null;
    }
  }

  return null;
};

const normalizeReceivablePayload = (
  receivable,
  { requirePaymentDate = false } = {},
) => {
  if (!receivable) {
    if (requirePaymentDate) {
      throw new Error(
        'La configuración de cuentas por cobrar es requerida para completar la venta a crédito.',
      );
    }
    return null;
  }

  if (typeof receivable !== 'object') {
    throw new Error('Formato inválido para la cuenta por cobrar.');
  }

  const now = Date.now();
  const createdAt = toMilliseconds(receivable.createdAt) ?? now;
  const updatedAt = toMilliseconds(receivable.updatedAt) ?? now;
  const paymentDate = toMilliseconds(receivable.paymentDate);
  const lastPaymentDate = toMilliseconds(receivable.lastPaymentDate);

  if (requirePaymentDate && paymentDate == null) {
    throw new Error(
      'Debes seleccionar la fecha del primer pago para continuar.',
    );
  }

  return {
    ...receivable,
    createdAt,
    updatedAt,
    paymentDate: paymentDate ?? null,
    lastPaymentDate: lastPaymentDate ?? null,
  };
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
  const resolvedBusinessId =
    businessId ||
    business?.id ||
    business?.businessID ||
    normalizedUser?.businessID ||
    null;
  const resolvedUserId = userId || normalizedUser?.uid || null;

  const payload = {
    idempotencyKey,
    businessId: resolvedBusinessId,
    userId: resolvedUserId,
    cart: normalizeCart(cart ?? null),
    client: client ?? null,
    accountsReceivable: cart?.isAddedToReceivables
      ? normalizeReceivablePayload(accountsReceivable, {
          requirePaymentDate: true,
        })
      : null,
    insuranceAR: insuranceEnabled
      ? normalizeReceivablePayload(insuranceAR ?? null)
      : null,
    insuranceAuth: insuranceAuth ?? null,
    insuranceEnabled: Boolean(insuranceEnabled),
    taxReceiptEnabled: Boolean(taxReceiptEnabled),
    ncfType: ncfType ?? null,
    dueDate:
      typeof dueDate === 'number' ? dueDate : dueDate ? Number(dueDate) : null,
    invoiceComment: invoiceComment ?? null,
    insurance: insurance ?? {
      enabled: Boolean(insuranceEnabled),
      AR: insuranceAR ?? null,
      auth: insuranceAuth ?? null,
    },
    preorder:
      preorder ??
      (cart?.preorderDetails ? { ...cart.preorderDetails } : undefined),
    ncf: normalizeNcf({ taxReceiptEnabled, ncfType, ncf }),
    isTestMode: Boolean(isTestMode),
  };

  if (normalizedUser) {
    payload.user = normalizedUser;
  }

  if (!payload.businessId) {
    throw new Error('businessId es requerido para iniciar la factura');
  }

  if (!payload.userId) {
    throw new Error('userId es requerido para iniciar la factura');
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
  const outboxRef = collection(
    db,
    `businesses/${businessId}/invoicesV2/${invoiceId}/outbox`,
  );
  const failedQuery = query(
    outboxRef,
    where('status', '==', 'failed'),
    limit(1),
  );
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
    throw new Error('businessId es requerido para consultar la factura');
  }
  if (!invoiceId) {
    throw new Error('invoiceId es requerido para consultar la factura');
  }

  const invoiceRef = doc(
    db,
    `businesses/${businessId}/invoicesV2/${invoiceId}`,
  );
  const canonicalRef = doc(
    db,
    `businesses/${businessId}/invoices/${invoiceId}`,
  );

  const startedAt = Date.now();
  let lastSnapshot = null;
  const MAX_RETRIES = 10;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    if (signal?.aborted) {
      throw new DOMException(
        'La consulta de factura fue cancelada',
        'AbortError',
      );
    }

    const invoiceSnap = await getDoc(invoiceRef);
    retryCount++;
    const invoiceData = invoiceSnap.exists() ? invoiceSnap.data() : null;
    if (invoiceData) {
      lastSnapshot = invoiceData;
      if (invoiceData.status === 'failed') {
        const failedTask = await fetchFailedTask({ businessId, invoiceId });
        const errorMessage =
          failedTask?.lastError ||
          (failedTask?.type
            ? `La tarea ${failedTask.type} falló durante el procesamiento.`
            : 'El proceso de factura falló.');
        const error = new Error(errorMessage);
        error.code = 'invoice-failed';
        error.invoice = invoiceData;
        error.failedTask = failedTask;
        throw error;
      }

      const isFrontendReady = invoiceData.status === 'frontend_ready';
      const isCommitted = invoiceData.status === 'committed';

      if (isFrontendReady || isCommitted) {
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
      const timeoutError = new Error(
        'Tiempo de espera agotado al confirmar la factura. Verifica el estado en el historial de facturación.',
      );
      timeoutError.code = 'invoice-timeout';
      timeoutError.invoice = lastSnapshot;
      throw timeoutError;
    }

    await delay(pollInterval);
  }

  const exhaustedError = new Error(
    'No se pudo confirmar la factura después de varios intentos. Verifica el historial de facturación o intenta nuevamente.',
  );
  exhaustedError.code = 'invoice-retries-exceeded';
  exhaustedError.invoice = lastSnapshot;
  exhaustedError.invoiceId = invoiceId;
  exhaustedError.businessId = businessId;
  throw exhaustedError;
};
