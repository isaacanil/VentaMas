import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseconfig';

const sanitizeUserSnapshot = (userLike) => {
  if (!userLike || typeof userLike !== 'object') return null;
  return {
    uid: userLike.uid || userLike.id || '',
    name:
      userLike.displayName ||
      userLike.name ||
      userLike.username ||
      userLike.email ||
      '',
    role: userLike.role || '',
    email: userLike.email || '',
  };
};

const sanitizeTarget = (targetLike) => {
  if (!targetLike || typeof targetLike !== 'object') return null;
  return {
    type: targetLike.type || '',
    id: targetLike.id || targetLike.key || '',
    name: targetLike.name || targetLike.title || targetLike.reference || '',
    details: targetLike.details || undefined,
  };
};

/**
 * Registra en Firestore un evento de autorización con PIN o contraseña.
 */
export const fbRecordAuthorizationApproval = async ({
  businessId,
  module = 'generic',
  action = 'authorization',
  description = '',
  requestedBy = null,
  authorizer,
  targetUser = null,
  target = null,
  metadata = null,
}) => {
  if (!businessId || !authorizer?.uid) {
    return;
  }

  const payload = {
    module,
    action,
    description,
    requestedBy: sanitizeUserSnapshot(requestedBy),
    authorizer: sanitizeUserSnapshot(authorizer),
    targetUser: sanitizeUserSnapshot(targetUser),
    target: sanitizeTarget(target),
    metadata: metadata && typeof metadata === 'object' ? { ...metadata } : null,
    sameUser: Boolean(requestedBy?.uid && requestedBy.uid === authorizer.uid),
    createdAt: serverTimestamp(),
  };

  try {
    const collectionRef = collection(db, 'businesses', businessId, 'approvalLogs');
    await addDoc(collectionRef, payload);
  } catch (error) {
    console.error('Error registrando aprobación con PIN:', error);
  }
};

export default fbRecordAuthorizationApproval;

const parseTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const normalizeLogEntry = (docSnap) => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    module: data.module || 'generic',
    action: data.action || 'authorization',
    description: data.description || '',
    requestedBy: sanitizeUserSnapshot(data.requestedBy) || null,
    authorizer: sanitizeUserSnapshot(data.authorizer) || null,
    targetUser: sanitizeUserSnapshot(data.targetUser) || null,
    target: sanitizeTarget(data.target),
    metadata: data.metadata || null,
    sameUser: Boolean(data.sameUser),
    createdAt: parseTimestamp(data.createdAt),
  };
};

export const fbListApprovalLogs = async (
  currentUser,
  { limitCount = 150, module: moduleFilter, authorizerId, startDate, endDate } = {}
) => {
  if (!currentUser?.businessID) {
    throw new Error('Falta businessID del usuario para listar la bitácora.');
  }

  const colRef = collection(db, 'businesses', currentUser.businessID, 'approvalLogs');
  const constraints = [];

  if (moduleFilter) {
    constraints.push(where('module', '==', moduleFilter));
  }

  if (authorizerId) {
    constraints.push(where('authorizer.uid', '==', authorizerId));
  }

  if (startDate) {
    constraints.push(where('createdAt', '>=', Timestamp.fromMillis(Number(startDate))));
  }

  if (endDate) {
    constraints.push(where('createdAt', '<=', Timestamp.fromMillis(Number(endDate))));
  }

  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(limitCount));

  const qy = query(colRef, ...constraints);
  const snapshot = await getDocs(qy);

  return snapshot.docs.map(normalizeLogEntry);
};
