import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  onSnapshot,
} from 'firebase/firestore';

import { fbGetCashCountState } from '@/firebase/cashCount/fbCashCountStatus';
import { db } from '@/firebase/firebaseconfig';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import type { TimestampLike } from '@/utils/date/types';

type AuthorizationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'used'
  | 'expired'
  | 'completed'
  | 'all'
  | string;

type AuthorizationRequest = Record<string, unknown> & {
  id?: string;
  status?: AuthorizationStatus;
  module?: string;
  collectionKey?: string;
  createdAt?: TimestampLike;
  created_at?: TimestampLike;
  created?: TimestampLike;
  approvedAt?: TimestampLike;
  requestedBy?: { uid?: string | null } | null;
};

type AuthorizationDoc = AuthorizationRequest & { id: string };

type CashCountInfo = {
  exists?: boolean;
  state?: string | null;
};

const LEGACY_COLLECTION_NAME = 'invoiceEditAuthorizations';
const GENERIC_COLLECTION_NAME = 'authorizationRequests';
const REQUEST_MODULE = 'invoices';
const REQUEST_TYPE = 'invoice-edit';
const EDIT_WINDOW_HOURS = 48;
const MAX_EDIT_WINDOW_SECONDS = EDIT_WINDOW_HOURS * 60 * 60;
const COMPLETED_STATUSES = ['approved', 'rejected', 'used', 'expired'];
const GENERIC_FETCH_MULTIPLIER = 3;

const getLegacyColRef = (businessID: string) =>
  collection(db, 'businesses', businessID, LEGACY_COLLECTION_NAME);
const getGenericColRef = (businessID: string) =>
  collection(db, 'businesses', businessID, GENERIC_COLLECTION_NAME);

const calcExpiresAt = (hours = EDIT_WINDOW_HOURS) => {
  const ms = Date.now() + hours * 60 * 60 * 1000;
  return Timestamp.fromMillis(ms);
};

const extractTimestampSeconds = (value: TimestampLike): number | null => {
  if (!value) return null;
  if (typeof value === 'number') {
    return value > 1e12 ? value / 1000 : value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return null;
    return parsed > 1e12 ? parsed / 1000 : parsed;
  }
  if (value instanceof Date) {
    return value.getTime() / 1000;
  }
  if (value instanceof Timestamp) {
    return value.seconds;
  }
  if (typeof value === 'object') {
    if (typeof value.seconds === 'number') {
      return value.seconds;
    }
    if (typeof value.toMillis === 'function') {
      return value.toMillis() / 1000;
    }
  }
  return null;
};

const resolveInvoiceTimestampSeconds = (
  invoice: InvoiceData | null | undefined,
): number | null => {
  if (!invoice) return null;
  return (
    extractTimestampSeconds(invoice.date) ??
    extractTimestampSeconds(invoice.createdAt) ??
    extractTimestampSeconds(invoice.created_at) ??
    extractTimestampSeconds(invoice.created)
  );
};

const toMillisFromAny = (value: TimestampLike): number | null => {
  if (!value) return null;
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value instanceof Date) return value.getTime();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
  }
  if (typeof value === 'number') {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return null;
    return parsed > 1e12 ? parsed : parsed * 1000;
  }
  return null;
};

const shouldExpirePending = (data: AuthorizationRequest | null | undefined) => {
  if (!data || data.status !== 'pending') return false;
  const expiresMillis = toMillisFromAny(data.expiresAt);
  return typeof expiresMillis === 'number' && expiresMillis < Date.now();
};

const normalizeModuleFromData = (data: Record<string, unknown> = {}) => {
  if (typeof data.module === 'string' && data.module.trim()) return data.module;
  if (data.metadata && typeof data.metadata.module === 'string')
    return data.metadata.module;
  if (data.collectionKey === LEGACY_COLLECTION_NAME) return REQUEST_MODULE;
  if (data.invoiceId || data.invoiceNumber) return REQUEST_MODULE;
  return 'generic';
};

const mapDocToAuthorization = (
  docSnap: { id: string; data: () => Record<string, unknown> },
  collectionKey: string,
): AuthorizationDoc => {
  const data = (docSnap.data() || {}) as AuthorizationRequest;
  const moduleKey = normalizeModuleFromData(data);
  return {
    id: docSnap.id,
    ...data,
    module: moduleKey,
    collectionKey:
      collectionKey ||
      data.collectionKey ||
      (moduleKey === REQUEST_MODULE
        ? GENERIC_COLLECTION_NAME
        : LEGACY_COLLECTION_NAME),
  };
};

const resolveRequestDoc = async (
  businessID: string,
  requestId: string,
): Promise<
  | { ref: ReturnType<typeof doc>; snap: Awaited<ReturnType<typeof getDoc>>; collectionKey: string }
  | null
> => {
  const genericRef = doc(
    db,
    'businesses',
    businessID,
    GENERIC_COLLECTION_NAME,
    requestId,
  );
  const genericSnap = await getDoc(genericRef);
  if (genericSnap.exists()) {
    return {
      ref: genericRef,
      snap: genericSnap,
      collectionKey: GENERIC_COLLECTION_NAME,
    };
  }

  const legacyRef = doc(
    db,
    'businesses',
    businessID,
    LEGACY_COLLECTION_NAME,
    requestId,
  );
  const legacySnap = await getDoc(legacyRef);
  if (legacySnap.exists()) {
    return {
      ref: legacyRef,
      snap: legacySnap,
      collectionKey: LEGACY_COLLECTION_NAME,
    };
  }

  return null;
};

const ensurePendingExpiration = async ({
  docSnap,
  status,
  collectionKey,
}: {
  docSnap: { id: string; data: () => AuthorizationRequest; ref: unknown };
  status: AuthorizationStatus;
  collectionKey: string;
}): Promise<AuthorizationDoc | null> => {
  const data = docSnap.data();
  if (!shouldExpirePending(data)) {
    return mapDocToAuthorization(docSnap, collectionKey);
  }

  try {
    await updateDoc(docSnap.ref, { status: 'expired' });
  } catch {
    // Ignore failures when marking as expired to avoid interrupting the listing
  }

  const normalized: AuthorizationDoc = {
    id: docSnap.id,
    ...data,
    status: 'expired',
    module: normalizeModuleFromData(data),
    collectionKey,
  };

  if (status === 'pending') {
    return null;
  }

  return normalized;
};

const filterByStatus = (
  requests: AuthorizationDoc[],
  status: AuthorizationStatus,
) => {
  if (status === 'all') return requests;
  if (status === 'completed') {
    return requests.filter((item) => COMPLETED_STATUSES.includes(item.status));
  }
  return requests.filter((item) => (item.status || 'pending') === status);
};

const sortRequestsByDate = (requests: AuthorizationDoc[]) => {
  const clone = [...requests];
  clone.sort((a, b) => {
    const aMillis =
      toMillisFromAny(a.createdAt) ??
      toMillisFromAny(a.created_at) ??
      toMillisFromAny(a.created) ??
      toMillisFromAny(a.approvedAt) ??
      0;
    const bMillis =
      toMillisFromAny(b.createdAt) ??
      toMillisFromAny(b.created_at) ??
      toMillisFromAny(b.created) ??
      toMillisFromAny(b.approvedAt) ??
      0;
    return bMillis - aMillis;
  });
  return clone;
};

const fetchGenericRequests = async (
  businessID: string,
  {
    status,
    limitCount,
    modules,
  }: { status: AuthorizationStatus; limitCount: number; modules?: string[] | null },
): Promise<AuthorizationDoc[]> => {
  const colRef = getGenericColRef(businessID);
  const fetchLimit = Math.max(
    limitCount * GENERIC_FETCH_MULTIPLIER,
    limitCount,
  );
  const qy = query(colRef, orderBy('createdAt', 'desc'), limit(fetchLimit));
  const snap = await getDocs(qy);
  const items: AuthorizationDoc[] = [];

  for (const docSnap of snap.docs) {
    const normalized = await ensurePendingExpiration({
      docSnap,
      status,
      collectionKey: GENERIC_COLLECTION_NAME,
    });

    if (!normalized) continue;

    const moduleKey = normalized.module || normalizeModuleFromData(normalized);
    if (
      Array.isArray(modules) &&
      modules.length &&
      !modules.includes(moduleKey)
    ) {
      continue;
    }

    items.push(normalized);
  }

  return items;
};

const fetchLegacyInvoiceRequests = async (
  businessID: string,
  { status, limitCount }: { status: AuthorizationStatus; limitCount: number },
): Promise<AuthorizationDoc[]> => {
  const colRef = getLegacyColRef(businessID);
  const fetchLimit = Math.max(
    limitCount * GENERIC_FETCH_MULTIPLIER,
    limitCount,
  );
  const qy = query(colRef, orderBy('createdAt', 'desc'), limit(fetchLimit));
  const snap = await getDocs(qy);
  const items: AuthorizationDoc[] = [];

  for (const docSnap of snap.docs) {
    const normalized = await ensurePendingExpiration({
      docSnap,
      status,
      collectionKey: LEGACY_COLLECTION_NAME,
    });

    if (!normalized) continue;

    items.push({
      ...normalized,
      module: REQUEST_MODULE,
    });
  }

  return items;
};

const listRequestsInternal = async (
  user: UserIdentity | null | undefined,
  {
    status = 'pending',
    limitCount = 200,
    modules,
  }: { status?: AuthorizationStatus; limitCount?: number; modules?: string[] } = {},
): Promise<AuthorizationDoc[]> => {
  if (!user?.businessID) throw new Error('Falta businessID del usuario');

  const normalizedModules =
    Array.isArray(modules) && modules.length ? modules : null;

  const genericRequests = await fetchGenericRequests(user.businessID, {
    status,
    limitCount,
    modules: normalizedModules,
  });

  let legacyRequests: AuthorizationDoc[] = [];
  if (!normalizedModules || normalizedModules.includes(REQUEST_MODULE)) {
    legacyRequests = await fetchLegacyInvoiceRequests(user.businessID, {
      status,
      limitCount,
    });
  }

  const combined = [...genericRequests, ...legacyRequests];
  const filtered = filterByStatus(combined, status);
  const sorted = sortRequestsByDate(filtered);
  return sorted.slice(0, limitCount);
};

const buildUserSnapshot = (
  userLike: UserIdentity | null | undefined,
  fallbackRole: string,
) => ({
  uid: userLike?.uid ?? '',
  name: userLike?.displayName || userLike?.name || '',
  role: userLike?.role || fallbackRole,
});

const updateAuthorizationRequest = async (
  user: UserIdentity | null | undefined,
  requestId: string,
  payload: Record<string, unknown>,
) => {
  if (!user?.businessID) throw new Error('Falta businessID del usuario');
  const resolved = await resolveRequestDoc(user.businessID, requestId);
  if (!resolved) throw new Error('Solicitud de autorización no encontrada');
  await updateDoc(resolved.ref, payload);
  return resolved.collectionKey;
};

const checkExistingPendingInvoiceRequest = async (
  businessID: string,
  invoiceId: string,
) => {
  const genericColRef = getGenericColRef(businessID);
  const genericQuery = query(
    genericColRef,
    where('invoiceId', '==', invoiceId),
    where('status', '==', 'pending'),
    limit(1),
  );
  const genericSnap = await getDocs(genericQuery);
  if (!genericSnap.empty) {
    const docSnap = genericSnap.docs[0];
    if (shouldExpirePending(docSnap.data())) {
      try {
        await updateDoc(docSnap.ref, { status: 'expired' });
      } catch {
        /* Ignore expiration errors */
      }
    } else {
      return {
        alreadyPending: true,
        id: docSnap.id,
        collectionKey: GENERIC_COLLECTION_NAME,
      };
    }
  }

  const legacyColRef = getLegacyColRef(businessID);
  const legacyQuery = query(
    legacyColRef,
    where('invoiceId', '==', invoiceId),
    where('status', '==', 'pending'),
    limit(1),
  );
  const legacySnap = await getDocs(legacyQuery);
  if (!legacySnap.empty) {
    const docSnap = legacySnap.docs[0];
    if (shouldExpirePending(docSnap.data())) {
      try {
        await updateDoc(docSnap.ref, { status: 'expired' });
      } catch {
        /* Ignore expiration errors */
      }
    } else {
      return {
        alreadyPending: true,
        id: docSnap.id,
        collectionKey: LEGACY_COLLECTION_NAME,
      };
    }
  }

  return null;
};

const validateInvoiceConstraints = async (
  user: UserIdentity,
  invoice: InvoiceData,
) => {
  const createdSeconds = resolveInvoiceTimestampSeconds(invoice);
  if (
    createdSeconds &&
    createdSeconds < Date.now() / 1000 - MAX_EDIT_WINDOW_SECONDS
  ) {
    throw new Error(
      'No puedes solicitar la autorización: la factura supera el límite de 48 horas para editarse.',
    );
  }

  const cashCountId = invoice?.cashCountId ?? invoice?.cashCountID ?? null;
  if (cashCountId) {
    const cashCountInfo = (await fbGetCashCountState(
      user,
      cashCountId,
    )) as CashCountInfo | null;

    if (!cashCountInfo?.exists) {
      throw new Error(
        'No se encontró el cuadre de caja asociado a la factura. No es posible solicitar la autorización de edición.',
      );
    }

    if (cashCountInfo.state && cashCountInfo.state !== 'open') {
      const stateMessage =
        cashCountInfo.state === 'closed'
          ? 'El cuadre de caja asociado a la factura ya está cerrado.'
          : 'El cuadre de caja asociado a la factura no está abierto.';
      throw new Error(
        `${stateMessage} No es posible solicitar la autorización de edición.`,
      );
    }
  }
};

export const requestInvoiceEditAuthorization = async (
  user: UserIdentity | null | undefined,
  invoice: InvoiceData | null | undefined,
  reasons: string[] = [],
  note = '',
) => {
  if (!user?.businessID) throw new Error('Falta businessID del usuario');
  if (!invoice?.id) throw new Error('Falta id de la factura');

  await validateInvoiceConstraints(user, invoice);

  const duplicate = await checkExistingPendingInvoiceRequest(
    user.businessID,
    invoice.id,
  );
  if (duplicate) {
    return duplicate;
  }

  const payload: Record<string, unknown> = {
    businessID: user.businessID,
    module: REQUEST_MODULE,
    type: REQUEST_TYPE,
    collectionKey: GENERIC_COLLECTION_NAME,
    legacyCollectionKey: LEGACY_COLLECTION_NAME,
    referenceType: 'invoice',
    reference: invoice.numberID || invoice.id || null,
    invoiceId: invoice.id,
    invoiceNumber: invoice.numberID || null,
    metadata: {
      module: REQUEST_MODULE,
      invoiceId: invoice.id,
      invoiceNumber: invoice.numberID || null,
      cashCountId: invoice?.cashCountId ?? invoice?.cashCountID ?? null,
    },
    createdAt: serverTimestamp(),
    expiresAt: calcExpiresAt(),
    status: 'pending',
    reasons: Array.isArray(reasons) ? reasons.filter(Boolean) : [],
    requestNote: note || '',
    requestedBy: buildUserSnapshot(user, user?.role || 'cashier'),
    approvedBy: null,
    approvedAt: null,
    usedBy: null,
    usedAt: null,
  };

  const colRef = getGenericColRef(user.businessID);
  const res = await addDoc(colRef, payload);
  return { id: res.id, collectionKey: GENERIC_COLLECTION_NAME };
};

export const approveAuthorizationRequest = async (
  user: UserIdentity | null | undefined,
  requestId: string,
  approver: UserIdentity | null | undefined,
) => {
  await updateAuthorizationRequest(user, requestId, {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: buildUserSnapshot(approver, 'admin'),
  });
};

export const approveInvoiceEditAuthorization = approveAuthorizationRequest;

export const rejectAuthorizationRequest = async (
  user: UserIdentity | null | undefined,
  requestId: string,
  approver: UserIdentity | null | undefined,
) => {
  await updateAuthorizationRequest(user, requestId, {
    status: 'rejected',
    approvedAt: serverTimestamp(),
    approvedBy: buildUserSnapshot(approver, 'admin'),
  });
};

export const rejectInvoiceEditAuthorization = rejectAuthorizationRequest;

export const expireIfNeeded = async (
  businessID: string,
  requestId: string,
) => {
  if (!businessID) throw new Error('Falta businessID del negocio');
  const resolved = await resolveRequestDoc(businessID, requestId);
  if (!resolved) return false;
  const data = resolved.snap.data();
  if (shouldExpirePending(data)) {
    await updateDoc(resolved.ref, { status: 'expired' });
    return true;
  }
  return false;
};

export const markAuthorizationRequestUsed = async (
  user: UserIdentity | null | undefined,
  requestId: string,
  usedBy: UserIdentity | null | undefined,
) => {
  await updateAuthorizationRequest(user, requestId, {
    status: 'used',
    usedAt: serverTimestamp(),
    usedBy: buildUserSnapshot(usedBy, 'cashier'),
  });
};

export const markAuthorizationUsed = markAuthorizationRequestUsed;

export const getActiveApprovedAuthorizationForInvoice = async (
  user: UserIdentity | null | undefined,
  invoice: InvoiceData | null | undefined,
) => {
  if (!user?.businessID) throw new Error('Falta businessID del usuario');

  let invoiceConstraint;
  if (invoice?.id) {
    invoiceConstraint = where('invoiceId', '==', invoice.id);
  } else if (invoice?.numberID) {
    invoiceConstraint = where('invoiceNumber', '==', invoice.numberID);
  } else {
    return null;
  }

  const genericColRef = getGenericColRef(user.businessID);
  const genericQuery = query(
    genericColRef,
    invoiceConstraint,
    where('status', '==', 'approved'),
    orderBy('approvedAt', 'desc'),
    limit(1),
  );
  const genericSnap = await getDocs(genericQuery);
  if (!genericSnap.empty) {
    const docSnap = genericSnap.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
      collectionKey: GENERIC_COLLECTION_NAME,
    };
  }

  const legacyColRef = getLegacyColRef(user.businessID);
  const legacyQuery = query(
    legacyColRef,
    invoiceConstraint,
    where('status', '==', 'approved'),
    orderBy('approvedAt', 'desc'),
    limit(1),
  );
  const legacySnap = await getDocs(legacyQuery);
  if (!legacySnap.empty) {
    const docSnap = legacySnap.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
      collectionKey: LEGACY_COLLECTION_NAME,
    };
  }

  return null;
};

export const listPendingInvoiceEditAuthorizations = async (
  user: UserIdentity | null | undefined,
) => {
  return listRequestsInternal(user, {
    status: 'pending',
    limitCount: 200,
    modules: [REQUEST_MODULE],
  });
};

export const listInvoiceEditAuthorizations = async (
  user: UserIdentity | null | undefined,
  { status = 'pending', limitCount = 200 } = {},
) => {
  return listRequestsInternal(user, {
    status,
    limitCount,
    modules: [REQUEST_MODULE],
  });
};

export const listAuthorizationRequests = async (
  user: UserIdentity | null | undefined,
  options: { status?: AuthorizationStatus; limitCount?: number; modules?: string[] } = {},
) => {
  return listRequestsInternal(user, options);
};

export const markAuthorizationRequestExpiredIfNeeded = expireIfNeeded;

/**
 * Listener en tiempo real para autorizaciones
 * @param {string} businessID - ID del negocio
 * @param {string|null} status - Estado a filtrar ('pending', 'approved', etc.) o null para todos
 * @param {string|null} userId - ID del usuario para filtrar sus solicitudes, o null para todas
 * @param {Function} onUpdate - Callback que recibe el array de autorizaciones
 * @param {Function} onError - Callback para errores
 * @returns {Function} - Función para cancelar el listener
 */
export const listenToAuthorizationsByStatus = (
  businessID: string,
  status: AuthorizationStatus | null = null,
  userId: string | null = null,
  onUpdate: (items: AuthorizationDoc[]) => void,
  onError?: (error: Error) => void,
): (() => void) | undefined => {
  if (!businessID) {
    onError?.(new Error('businessID is required'));
    return undefined;
  }

  const buildQuery = (colRef: ReturnType<typeof collection>) => {
    const constraints = [];
    const shouldFilterByStatus =
      status && status !== 'completed' && status !== 'all';
    if (shouldFilterByStatus) {
      constraints.push(where('status', '==', status));
    }
    if (userId) {
      constraints.push(where('requestedBy.uid', '==', userId));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(100));
    return query(colRef, ...constraints);
  };

  let latestGeneric: AuthorizationDoc[] = [];
  let latestLegacy: AuthorizationDoc[] = [];

  const emitUpdate = () => {
    const merged = [...latestGeneric, ...latestLegacy];
    const filteredByStatus = status ? filterByStatus(merged, status) : merged;
    const filteredByUser = userId
      ? filteredByStatus.filter((item) => item?.requestedBy?.uid === userId)
      : filteredByStatus;
    const sorted = sortRequestsByDate(filteredByUser).slice(0, 100);
    onUpdate(sorted);
  };

  const processSnapshot = async (
    snapshot: { docs: Array<{ id: string; data: () => AuthorizationRequest; ref: unknown }> },
    collectionKey: string,
  ) => {
    const processed: AuthorizationDoc[] = [];
    for (const docSnap of snapshot.docs) {
      const normalized = await ensurePendingExpiration({
        docSnap,
        status,
        collectionKey,
      });
      if (normalized) {
        processed.push(normalized);
      }
    }
    return processed;
  };

  const subscriptions = [];

  const genericQuery = buildQuery(getGenericColRef(businessID));
  const legacyQuery = buildQuery(getLegacyColRef(businessID));

  const genericUnsub = onSnapshot(
    genericQuery,
    (snapshot) => {
      processSnapshot(snapshot, GENERIC_COLLECTION_NAME)
        .then((data) => {
          latestGeneric = data;
          emitUpdate();
        })
        .catch((error) => {
          console.error('Error procesando autorizaciones genéricas:', error);
          onError?.(error);
        });
    },
    (error) => {
      console.error('Error en listener de autorizaciones genéricas:', error);
      onError?.(error);
    },
  );
  subscriptions.push(genericUnsub);

  const legacyUnsub = onSnapshot(
    legacyQuery,
    (snapshot) => {
      processSnapshot(snapshot, LEGACY_COLLECTION_NAME)
        .then((data) => {
          latestLegacy = data;
          emitUpdate();
        })
        .catch((error) => {
          console.error('Error procesando autorizaciones legacy:', error);
          onError?.(error);
        });
    },
    (error) => {
      console.error('Error en listener de autorizaciones legacy:', error);
      onError?.(error);
    },
  );
  subscriptions.push(legacyUnsub);

  return () => {
    subscriptions.forEach((unsub) => {
      try {
        unsub?.();
      } catch (cleanupError) {
        console.warn(
          'Error limpiando listener de autorizaciones:',
          cleanupError,
        );
      }
    });
  };
};
