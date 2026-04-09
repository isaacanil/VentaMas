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
  type DocumentSnapshot,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { TimestampLike } from '@/utils/date/types';
import {
  resolveUserIdentityBusinessId,
  resolveUserIdentityRole,
  resolveUserIdentityUid,
} from '@/utils/users/userIdentityAccess';

type UserSnapshot = {
  uid: string;
  name: string;
  role: string;
  email: string;
};

type TargetSnapshot = {
  type: string;
  id: string;
  name: string;
  details?: unknown;
};

type UserLike = UserIdentity & {
  displayName?: string;
  username?: string;
  email?: string;
};

type ApprovalLogPayload = {
  module: string;
  action: string;
  description: string;
  requestedBy: UserSnapshot | null;
  authorizer: UserSnapshot | null;
  targetUser: UserSnapshot | null;
  target: TargetSnapshot | null;
  metadata: Record<string, unknown> | null;
  sameUser: boolean;
  createdAt: ReturnType<typeof serverTimestamp>;
};

type ApprovalLogEntry = {
  id: string;
  module: string;
  action: string;
  description: string;
  requestedBy: UserSnapshot | null;
  authorizer: UserSnapshot | null;
  targetUser: UserSnapshot | null;
  target: TargetSnapshot | null;
  metadata: Record<string, unknown> | null;
  sameUser: boolean;
  createdAt: Date | null;
};

const sanitizeUserSnapshot = (
  userLike: UserLike | null | undefined,
): UserSnapshot | null => {
  if (!userLike || typeof userLike !== 'object') return null;
  const uid = resolveUserIdentityUid(userLike);
  const role = resolveUserIdentityRole(userLike);
  return {
    uid: uid || '',
    name:
      userLike.displayName ||
      userLike.name ||
      userLike.username ||
      userLike.email ||
      '',
    role: role || '',
    email: userLike.email || '',
  };
};

const sanitizeTarget = (
  targetLike: Record<string, unknown> | null | undefined,
): TargetSnapshot | null => {
  if (!targetLike || typeof targetLike !== 'object') return null;
  return {
    type: (targetLike.type as string) || '',
    id: (targetLike.id as string) || (targetLike.key as string) || '',
    name:
      (targetLike.name as string) ||
      (targetLike.title as string) ||
      (targetLike.reference as string) ||
      '',
    details: targetLike.details,
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
}: {
  businessId: string;
  module?: string;
  action?: string;
  description?: string;
  requestedBy?: UserLike | null;
  authorizer: UserLike | null;
  targetUser?: UserLike | null;
  target?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> => {
  if (!businessId || !authorizer?.uid) {
    return;
  }

  const payload: ApprovalLogPayload = {
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
    const collectionRef = collection(
      db,
      'businesses',
      businessId,
      'approvalLogs',
    );
    await addDoc(collectionRef, payload);
  } catch (error) {
    console.error('Error registrando aprobación con PIN:', error);
  }
};

export default fbRecordAuthorizationApproval;

const parseTimestamp = (value: TimestampLike): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (
    typeof value === 'object' &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
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

const normalizeLogEntry = (docSnap: DocumentSnapshot): ApprovalLogEntry => {
  const data = (docSnap.data() || {}) as Record<string, unknown>;
  return {
    id: docSnap.id,
    module: (data.module as string) || 'generic',
    action: (data.action as string) || 'authorization',
    description: (data.description as string) || '',
    requestedBy: sanitizeUserSnapshot(data.requestedBy as UserLike) || null,
    authorizer: sanitizeUserSnapshot(data.authorizer as UserLike) || null,
    targetUser: sanitizeUserSnapshot(data.targetUser as UserLike) || null,
    target: sanitizeTarget(data.target as Record<string, unknown>),
    metadata: (data.metadata as Record<string, unknown>) || null,
    sameUser: Boolean(data.sameUser),
    createdAt: parseTimestamp(data.createdAt as TimestampLike),
  };
};

export const fbListApprovalLogs = async (
  currentUser: UserIdentity | null | undefined,
  {
    limitCount = 150,
    module: moduleFilter,
    authorizerId,
    startDate,
    endDate,
  }: {
    limitCount?: number;
    module?: string;
    authorizerId?: string;
    startDate?: TimestampLike;
    endDate?: TimestampLike;
  } = {},
): Promise<ApprovalLogEntry[]> => {
  const businessId = resolveUserIdentityBusinessId(currentUser);
  if (!businessId) {
    throw new Error('Falta businessID del usuario para listar la bitácora.');
  }

  const colRef = collection(
    db,
    'businesses',
    businessId,
    'approvalLogs',
  );
  const constraints = [];

  if (moduleFilter) {
    constraints.push(where('module', '==', moduleFilter));
  }

  if (authorizerId) {
    constraints.push(where('authorizer.uid', '==', authorizerId));
  }

  if (startDate) {
    constraints.push(
      where('createdAt', '>=', Timestamp.fromMillis(Number(startDate))),
    );
  }

  if (endDate) {
    constraints.push(
      where('createdAt', '<=', Timestamp.fromMillis(Number(endDate))),
    );
  }

  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(limitCount));

  const qy = query(colRef, ...constraints);
  const snapshot = await getDocs(qy);

  return snapshot.docs.map(normalizeLogEntry);
};
