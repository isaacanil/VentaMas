import { normalizeRole, ROLE } from '../../../../core/constants/roles.constants.js';

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeStatus = (value) => {
  const status = toCleanString(value);
  if (!status) return 'active';
  return status.toLowerCase();
};

export const upsertAccessControlEntry = (entries, incomingEntry) => {
  const map = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry?.businessId) continue;
    map.set(entry.businessId, entry);
  }

  const existing = map.get(incomingEntry.businessId) || null;
  map.set(incomingEntry.businessId, {
    businessId: incomingEntry.businessId,
    role: normalizeRole(incomingEntry.role || existing?.role || ROLE.CASHIER) ||
      ROLE.CASHIER,
    status: normalizeStatus(incomingEntry.status || existing?.status),
    businessName:
      incomingEntry.businessName || existing?.businessName || null,
  });

  return Array.from(map.values());
};

export const toMembershipCacheEntries = (
  uid,
  accessControlEntries,
  options = {},
) => {
  const source = toCleanString(options.source) || 'user_cache_sync';
  const cleanedUid = toCleanString(uid);

  return (Array.isArray(accessControlEntries) ? accessControlEntries : [])
    .filter((entry) => entry?.businessId)
    .map((entry) => ({
      ...(cleanedUid ? { uid: cleanedUid, userId: cleanedUid } : {}),
      businessId: entry.businessId,
      role: normalizeRole(entry.role || ROLE.CASHIER) || ROLE.CASHIER,
      status: normalizeStatus(entry.status),
      source,
    }));
};

