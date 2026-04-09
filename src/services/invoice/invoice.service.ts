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

import { functions, db } from '@/firebase/firebaseconfig';
import type { InvoiceData } from '@/types/invoice';
import {
  getAccountingSettingsForBusiness,
  resolveMonetarySnapshotForBusiness,
} from '@/utils/accounting/monetary';
import { paymentMethodRequiresBankAccount } from '@/utils/payments/methods';
import { resolveEffectiveBankAccountId } from '@/utils/payments/bankPaymentPolicy';

import type {
  InvoiceCart,
  InvoiceCartProduct,
  InvoiceNcfPayload,
  InvoiceReceivablePayload,
  InvoiceRequestParams,
  InvoiceRequestPayload,
  InvoiceServiceError,
  InvoiceSubmitResponse,
  InvoiceSubmitResult,
  InvoiceWaitResult,
  NormalizedUser,
  UserIdentityLike,
  UnknownRecord,
} from './types';

const createInvoiceCallable = httpsCallable<
  InvoiceRequestPayload,
  InvoiceSubmitResponse
>(functions, 'createInvoiceV2');

const DEFAULT_POLL_INTERVAL_MS = 700;
const DEFAULT_TIMEOUT_MS = 45000;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const sanitizeNumericValues = (input: unknown): unknown => {
  if (input === undefined) {
    return null;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeNumericValues);
  }

  if (isPlainObject(input)) {
    return Object.entries(input).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        acc[key] = sanitizeNumericValues(value);
        return acc;
      },
      {},
    );
  }

  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }

  return input;
};

const normalizePilotBankPaymentMethods = async (
  businessId: string,
  paymentMethods: unknown,
): Promise<unknown[]> => {
  const entries = Array.isArray(paymentMethods) ? paymentMethods : [];
  const settings = await getAccountingSettingsForBusiness(businessId);
  if (!settings) {
    return entries;
  }
  if (settings?.bankAccountsEnabled === false) {
    return entries.map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return entry;
      }

      const method = entry as {
        method?: unknown;
      };
      if (!paymentMethodRequiresBankAccount(method.method)) {
        return entry;
      }

      return {
        ...entry,
        bankAccountId: null,
      };
    });
  }

  const normalizedMethods = entries.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      return entry;
    }

    const method = entry as {
      method?: unknown;
      bankAccountId?: unknown;
    };
    if (!paymentMethodRequiresBankAccount(method.method)) {
      return entry;
    }

    return {
      ...entry,
      bankAccountId: resolveEffectiveBankAccountId({
        method: method.method,
        moduleKey: 'sales',
        bankAccountId: method.bankAccountId,
        policy: settings?.bankPaymentPolicy,
      }),
    };
  });

  const invalidBankMethod = normalizedMethods.find((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const method = entry as {
      method?: unknown;
      status?: unknown;
      value?: unknown;
      amount?: unknown;
      bankAccountId?: unknown;
    };
    const active = method.status === true;
    const amount = safeNumber(method.value ?? method.amount) ?? 0;
    const bankAccountId =
      typeof method.bankAccountId === 'string'
        ? method.bankAccountId.trim()
        : '';
    return (
      active &&
      amount > 0 &&
      paymentMethodRequiresBankAccount(method.method) &&
      !bankAccountId
    );
  });

  if (invalidBankMethod) {
    throw new Error(
      'Los pagos con tarjeta o transferencia requieren una cuenta bancaria activa en este negocio.',
    );
  }

  return normalizedMethods;
};

const safeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeCart = (
  cart: InvoiceCart | null | undefined,
): InvoiceCart | null => {
  if (cart == null || typeof cart !== 'object') {
    return cart ?? null;
  }

  const normalizedCart: InvoiceCart = { ...cart };

  if (Array.isArray(cart.products)) {
    normalizedCart.products = cart.products.map((product) => {
      if (product == null || typeof product !== 'object') {
        return product as InvoiceCartProduct;
      }

      const normalizedProduct: InvoiceCartProduct = { ...product };
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

const normalizeUser = (
  user: InvoiceRequestParams['user'],
): NormalizedUser | null => {
  if (!user) return null;
  const userLike: UserIdentityLike = user;
  const businessId =
    userLike.businessID ||
    userLike.businessId ||
    userLike.business?.id ||
    userLike.business?.businessID ||
    null;
  const uid =
    userLike.uid ||
    userLike.id ||
    userLike.userId ||
    userLike.user_id ||
    userLike.uuid ||
    null;
  return {
    uid,
    businessID: businessId,
  };
};

const normalizeNcf = ({
  taxReceiptEnabled,
  ncfType,
  ncf,
}: {
  taxReceiptEnabled?: boolean;
  ncfType?: string | null;
  ncf?: InvoiceNcfPayload | null;
}) => {
  const enabled = Boolean(taxReceiptEnabled || (ncf && ncf.enabled));
  const type = ncf?.type || ncfType || null;
  if (!enabled) {
    return { enabled: false, type: null };
  }
  return { enabled: true, type };
};

const toMilliseconds = (value: unknown): number | null => {
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

  if (typeof value === 'object') {
    const valueObj = value as {
      toMillis?: () => number;
      seconds?: number;
      _seconds?: number;
      nanoseconds?: number;
      nanosecond?: number;
      _nanoseconds?: number;
      nanoSeconds?: number;
      nanos?: number;
      valueOf?: () => unknown;
    };

    if (typeof valueObj.toMillis === 'function') {
      const millis = valueObj.toMillis();
      return Number.isFinite(millis) ? millis : null;
    }

    const seconds = valueObj.seconds ?? valueObj._seconds;
    const nanos =
      valueObj.nanoseconds ??
      valueObj.nanosecond ??
      valueObj._nanoseconds ??
      valueObj.nanoSeconds ??
      valueObj.nanos ??
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

    if (typeof valueObj.valueOf === 'function') {
      const raw = valueObj.valueOf();
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
  receivable: InvoiceReceivablePayload | UnknownRecord | null | undefined,
  { requirePaymentDate = false }: { requirePaymentDate?: boolean } = {},
): InvoiceReceivablePayload | null => {
  if (!receivable) {
    if (requirePaymentDate) {
      throw new Error(
        'La configuración de cuentas por cobrar es requerida para completar la venta a crédito.',
      ) as InvoiceServiceError;
    }
    return null;
  }

  if (typeof receivable !== 'object') {
    throw new Error('Formato inválido para la cuenta por cobrar.');
  }

  const receivableRecord = receivable as InvoiceReceivablePayload;
  const now = Date.now();
  const createdAt = toMilliseconds(receivableRecord.createdAt) ?? now;
  const updatedAt = toMilliseconds(receivableRecord.updatedAt) ?? now;
  const paymentDate = toMilliseconds(receivableRecord.paymentDate);
  const lastPaymentDate = toMilliseconds(receivableRecord.lastPaymentDate);

  if (requirePaymentDate && paymentDate == null) {
    throw new Error(
      'Debes seleccionar la fecha del primer pago para continuar.',
    );
  }

  return {
    ...receivableRecord,
    createdAt,
    updatedAt,
    paymentDate: paymentDate ?? null,
    lastPaymentDate: lastPaymentDate ?? null,
  };
};

export const generateIdempotencyKey = () => nanoid(21);

export const buildInvoiceRequestPayload = async ({
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
}: InvoiceRequestParams & {
  idempotencyKey: string;
}): Promise<InvoiceRequestPayload> => {
  const normalizedUser = normalizeUser(user);
  const resolvedBusinessId =
    businessId ||
    business?.id ||
    business?.businessID ||
    normalizedUser?.businessID ||
    null;
  const resolvedUserId = userId || normalizedUser?.uid || null;

  if (!resolvedBusinessId) {
    throw new Error('businessId es requerido para iniciar la factura');
  }

  if (!resolvedUserId) {
    throw new Error('userId es requerido para iniciar la factura');
  }

  const payload: InvoiceRequestPayload = {
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

  if (payload.cart) {
    payload.cart.paymentMethod = await normalizePilotBankPaymentMethods(
      resolvedBusinessId,
      payload.cart.paymentMethod ?? [],
    );
  }

  if (payload.cart && !payload.cart.monetary) {
    const totalPurchase = isPlainObject(payload.cart.totalPurchase)
      ? payload.cart.totalPurchase
      : {};
    const totalPurchaseWithoutTaxes = isPlainObject(
      payload.cart.totalPurchaseWithoutTaxes,
    )
      ? payload.cart.totalPurchaseWithoutTaxes
      : {};
    const totalTaxes = isPlainObject(payload.cart.totalTaxes)
      ? payload.cart.totalTaxes
      : {};
    const payment = isPlainObject(payload.cart.payment)
      ? payload.cart.payment
      : {};
    const total =
      safeNumber(totalPurchase.value) ?? safeNumber(payload.cart.totalAmount);
    const paid =
      safeNumber(payment.value) ?? safeNumber(payload.cart.totalPaid);
    const monetarySnapshot = await resolveMonetarySnapshotForBusiness({
      businessId: resolvedBusinessId,
      monetary: payload.cart.monetary,
      operationType: 'sale',
      source: payload.cart,
      totals: {
        subtotal: safeNumber(totalPurchaseWithoutTaxes.value),
        taxes: safeNumber(totalTaxes.value),
        total,
        paid,
        balance:
          total != null && paid != null ? Math.max(total - paid, 0) : undefined,
      },
      capturedBy: resolvedUserId,
    });
    if (monetarySnapshot) {
      payload.cart.monetary = monetarySnapshot;
    }
  }

  if (normalizedUser) {
    payload.user = normalizedUser;
  }

  return sanitizeNumericValues(payload) as InvoiceRequestPayload;
};

export const submitInvoice = async (
  params: InvoiceRequestParams,
): Promise<InvoiceSubmitResult> => {
  const idempotencyKey = params.idempotencyKey || generateIdempotencyKey();
  const payload = await buildInvoiceRequestPayload({
    ...params,
    idempotencyKey,
  });

  const { data } = await createInvoiceCallable(payload);

  return {
    ...data,
    idempotencyKey,
    businessId: payload.businessId,
    userId: payload.userId,
  };
};

type FailedTaskRecord = UnknownRecord & {
  lastError?: string;
  type?: string;
};

const fetchFailedTask = async ({
  businessId,
  invoiceId,
}: {
  businessId: string;
  invoiceId: string;
}): Promise<(FailedTaskRecord & { id: string }) | null> => {
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
  return { id: docSnap.id, ...(docSnap.data() as FailedTaskRecord) };
};

export const waitForInvoiceResult = async ({
  businessId,
  invoiceId,
  signal,
  pollInterval = DEFAULT_POLL_INTERVAL_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  businessId: string;
  invoiceId: string;
  signal?: AbortSignal;
  pollInterval?: number;
  timeoutMs?: number;
}): Promise<InvoiceWaitResult> => {
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
  let lastSnapshot: UnknownRecord | null = null;
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
    const invoiceData = invoiceSnap.exists()
      ? (invoiceSnap.data() as UnknownRecord & { status?: string })
      : null;
    if (invoiceData) {
      lastSnapshot = invoiceData;
      const invoiceStatus = invoiceData.status;
      if (invoiceStatus === 'failed') {
        const failedTask = await fetchFailedTask({ businessId, invoiceId });
        const errorMessage =
          failedTask?.lastError ||
          (failedTask?.type
            ? `La tarea ${failedTask.type} falló durante el procesamiento.`
            : 'El proceso de factura falló.');
        const error: InvoiceServiceError = Object.assign(
          new Error(errorMessage),
          {
            code: 'invoice-failed',
            invoice: invoiceData,
            failedTask,
          },
        );
        throw error;
      }

      const isFrontendReady = invoiceStatus === 'frontend_ready';
      const isCommitted = invoiceStatus === 'committed';

      if (isFrontendReady || isCommitted) {
        const canonicalSnap = await getDoc(canonicalRef);
        if (canonicalSnap.exists()) {
          const canonicalData = canonicalSnap.data() as UnknownRecord & {
            data?: InvoiceData | null;
          };
          return {
            invoice: canonicalData?.data ?? null,
            canonical: canonicalData ?? null,
            invoiceMeta: invoiceData,
          };
        }
      }
    }

    if (Date.now() - startedAt >= timeoutMs) {
      const timeoutError: InvoiceServiceError = new Error(
        'Tiempo de espera agotado al confirmar la factura. Verifica el estado en el historial de facturación.',
      );
      timeoutError.code = 'invoice-timeout';
      timeoutError.invoice = lastSnapshot;
      throw timeoutError;
    }

    await delay(pollInterval);
  }

  const exhaustedError: InvoiceServiceError = new Error(
    'No se pudo confirmar la factura después de varios intentos. Verifica el historial de facturación o intenta nuevamente.',
  );
  exhaustedError.code = 'invoice-retries-exceeded';
  exhaustedError.invoice = lastSnapshot;
  exhaustedError.invoiceId = invoiceId;
  exhaustedError.businessId = businessId;
  throw exhaustedError;
};
