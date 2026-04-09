import { DateTime } from 'luxon';

import { getRoleLabelById, userRoles } from '@/abilities/roles';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';

import type {
  BusinessUserRecord,
  PresenceMap,
  PresenceStatus,
  TimestampLike,
  TimestampSeconds,
  TimestampUnderscore,
  TimestampWithToMillis,
  UserFilters,
  UserListRow,
  UserProfile,
} from '../types';

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

export const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toCleanString(item))
    .filter((item): item is string => Boolean(item));
};

const dedupeStrings = (
  values: Array<string | null | undefined>,
): string[] => {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  );
};

export const resolveBusinessOwnerCandidates = (rawBusiness: unknown): string[] => {
  const root = asRecord(rawBusiness);
  const businessNode = asRecord(root.business);
  const nestedBusinessNode = asRecord(businessNode.business);

  return dedupeStrings([
    toCleanString(root.ownerUid),
    toCleanString(businessNode.ownerUid),
    toCleanString(nestedBusinessNode.ownerUid),
    ...toStringArray(root.owners),
    ...toStringArray(businessNode.owners),
    ...toStringArray(nestedBusinessNode.owners),
  ]);
};

const isTimestampWithSeconds = (
  value: TimestampLike,
): value is TimestampSeconds => {
  if (!value || typeof value !== 'object') return false;
  return (
    typeof (value as TimestampSeconds).seconds === 'number' &&
    typeof (value as TimestampSeconds).nanoseconds === 'number'
  );
};

const isTimestampWithUnderscore = (
  value: TimestampLike,
): value is TimestampUnderscore => {
  if (!value || typeof value !== 'object') return false;
  return (
    typeof (value as TimestampUnderscore)._seconds === 'number' &&
    typeof (value as TimestampUnderscore)._nanoseconds === 'number'
  );
};

const hasToMillis = (value: TimestampLike): value is TimestampWithToMillis => {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as TimestampWithToMillis).toMillis === 'function';
};

export const toMillis = (value: TimestampLike) => {
  if (typeof value === 'number') return value;
  if (hasToMillis(value)) {
    return value.toMillis();
  }
  if (isTimestampWithSeconds(value)) {
    return value.seconds * 1000 + value.nanoseconds / 1_000_000;
  }
  if (isTimestampWithUnderscore(value)) {
    return value._seconds * 1000 + value._nanoseconds / 1_000_000;
  }
  return null;
};

export const ROLE_FILTER_OPTIONS = userRoles.map((role) => ({
  label: role.label,
  value: role.id,
}));

export const STATUS_FILTER_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' },
];

export const PRESENCE_FILTER_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'En línea', value: 'online' },
  { label: 'Fuera de línea', value: 'offline' },
];

export const DEFAULT_FILTERS: UserFilters = {
  role: '',
  status: '',
  presence: '',
};

export const resolveActiveBusinessId = (
  currentUser: UserProfile | null,
): string | null => {
  return (
    toCleanString(currentUser?.activeBusinessId) ||
    toCleanString(currentUser?.businessID) ||
    toCleanString(currentUser?.businessId)
  );
};

export const resolveCurrentBusinessId = resolveActiveBusinessId;

export const buildUsersQueryContext = (activeBusinessId: string | null) => {
  if (!activeBusinessId) {
    return null;
  }

  return {
    businessID: activeBusinessId,
    businessId: activeBusinessId,
  };
};

export const collectUserIds = (users: BusinessUserRecord[]): string[] => {
  return Array.from(
    new Set(
      users
        .map((record) => {
          const root = record as BusinessUserRecord;
          const legacyUser =
            root.user && typeof root.user === 'object'
              ? (root.user as UserProfile)
              : null;
          return root.uid || root.id || legacyUser?.uid || legacyUser?.id;
        })
        .filter(Boolean)
        .map(String),
    ),
  );
};

export const limitPresenceMapToUserIds = (
  presenceMap: PresenceMap,
  userIds: string[],
): Record<string, PresenceStatus> => {
  if (userIds.length === 0) {
    return {};
  }

  const allowed = new Set(userIds);
  return Object.fromEntries(
    Object.entries(presenceMap).filter(([uid]) => allowed.has(String(uid))),
  );
};

export const buildUserListRows = ({
  businessOwnerCandidateSet,
  presenceMapForUsers,
  users,
}: {
  businessOwnerCandidateSet: Set<string>;
  presenceMapForUsers: Record<string, PresenceStatus>;
  users: BusinessUserRecord[];
}): UserListRow[] => {
  return users.map((record, index) => {
    const { user: _unusedLegacyUser, ...root } = record as BusinessUserRecord;
    const mergedUser = root as UserProfile;
    const normalizedRole = normalizeRoleId(
      mergedUser?.activeRole || mergedUser?.role,
    );

    const name = mergedUser?.name || 'Usuario sin nombre';
    const email = mergedUser?.email || mergedUser?.username || '';
    const isActive = Boolean(mergedUser?.active);
    const statusLabel = isActive ? 'Activo' : 'Inactivo';
    const userId = mergedUser?.uid || mergedUser?.id;
    const normalizedUserId = toCleanString(userId);
    const isBusinessOwner = Boolean(
      normalizedUserId && businessOwnerCandidateSet.has(normalizedUserId),
    );
    const presence = userId
      ? presenceMapForUsers[userId] || {
          state: 'offline',
          lastUpdated: null,
        }
      : { state: 'offline', lastUpdated: null };

    const meta = (mergedUser as Record<string, unknown>)?.meta as
      | Record<string, unknown>
      | undefined;
    const resolvedCreateAt =
      ((mergedUser as Record<string, unknown>)?.createdAt as TimestampLike) ??
      mergedUser?.createAt ??
      (meta?.createdAt as TimestampLike) ??
      null;

    return {
      id:
        normalizedUserId ||
        `user-row-${mergedUser?.number ?? 'na'}-${index}-${email || name}`,
      number: mergedUser?.number,
      name: {
        displayName: name,
        email,
      },
      createAt: resolvedCreateAt,
      role: normalizedRole || undefined,
      isBusinessOwner,
      status: {
        active: isActive,
        label: statusLabel,
      },
      presence,
      user: {
        ...mergedUser,
        isBusinessOwner,
        ...(normalizedRole
          ? { role: normalizedRole, activeRole: normalizedRole }
          : {}),
      },
      searchText:
        `${name} ${email} ${statusLabel} ${presence?.state ?? ''} ${
          getRoleLabelById(normalizedRole) ?? ''
        } ${isBusinessOwner ? 'dueno owner' : ''}`.toLowerCase(),
    };
  });
};

export const filterUserListRows = (
  data: UserListRow[],
  filters: UserFilters,
): UserListRow[] => {
  return data.filter((row) => {
    if (
      filters.role &&
      normalizeRoleId(row.role) !== normalizeRoleId(filters.role)
    ) {
      return false;
    }
    if (filters.status) {
      const isActive = row.status?.active;
      if (filters.status === 'active' && !isActive) return false;
      if (filters.status === 'inactive' && isActive) return false;
    }
    if (filters.presence) {
      const isOnline = row.presence?.state === 'online';
      if (filters.presence === 'online' && !isOnline) return false;
      if (filters.presence === 'offline' && isOnline) return false;
    }
    return true;
  });
};

export const sortUserListRows = (filteredData: UserListRow[]): UserListRow[] => {
  const getBucket = (presence: PresenceStatus) => {
    const isOnline = presence?.state === 'online';
    const lastSeen =
      typeof presence?.lastUpdated === 'number' ? presence.lastUpdated : null;
    if (isOnline) return { bucket: 0, lastSeen };
    if (lastSeen) return { bucket: 1, lastSeen };
    return { bucket: 2, lastSeen: null };
  };

  const getCreatedAt = (value: TimestampLike) => toMillis(value) ?? 0;
  const compareStableIdentity = (a: UserListRow, b: UserListRow) => {
    const aNumber =
      typeof a.number === 'number' ? a.number : Number.MAX_SAFE_INTEGER;
    const bNumber =
      typeof b.number === 'number' ? b.number : Number.MAX_SAFE_INTEGER;
    if (aNumber !== bNumber) return aNumber - bNumber;

    const aName = (a.name?.displayName || '').toLowerCase();
    const bName = (b.name?.displayName || '').toLowerCase();
    const nameCompare = aName.localeCompare(bName);
    if (nameCompare !== 0) return nameCompare;

    return String(a.id).localeCompare(String(b.id));
  };

  return [...filteredData].sort((a, b) => {
    const aBucket = getBucket(a.presence);
    const bBucket = getBucket(b.presence);

    if (aBucket.bucket !== bBucket.bucket) {
      return aBucket.bucket - bBucket.bucket;
    }

    if (aBucket.bucket === 0) {
      return compareStableIdentity(a, b);
    }

    const aLast = aBucket.lastSeen ?? getCreatedAt(a.createAt);
    const bLast = bBucket.lastSeen ?? getCreatedAt(b.createAt);
    if (aLast !== bLast) {
      return bLast - aLast;
    }

    return compareStableIdentity(a, b);
  });
};

export const getPresenceLabel = (
  presence: PresenceStatus | null | undefined,
): string => {
  const isOnline = presence?.state === 'online';
  if (isOnline) {
    return 'En linea';
  }

  const lastUpdated =
    typeof presence?.lastUpdated === 'number' ? presence.lastUpdated : null;
  if (!lastUpdated) {
    return 'Sin datos';
  }

  const date = DateTime.fromMillis(lastUpdated);
  const diffHours = DateTime.now().diff(date, 'hours').hours;
  if (diffHours < 24) {
    return date.toRelative({ style: 'short' }) || 'Reciente';
  }

  return date.toFormat('dd/LL/yyyy');
};

export const buildUserSearchFilterItem = ({
  onChange,
  searchTerm,
}: {
  onChange: (value: string) => void;
  searchTerm: string;
}) => ({
  key: 'search',
  section: 'main' as const,
  type: 'input' as const,
  value: searchTerm,
  onChange,
  placeholder: 'Buscar usuario',
  width: 240,
  allowClear: true,
  ariaLabel: 'Buscar usuario',
});
