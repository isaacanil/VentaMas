import { hasDeveloperAccess } from '@/utils/access/developerAccess';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const looksLikeIdLabel = (name: string, businessId: string | null): boolean => {
  if (!businessId) return false;
  const normalizedName = name.toLowerCase();
  const normalizedBusinessId = businessId.toLowerCase();
  return (
    normalizedName === normalizedBusinessId ||
    normalizedName === `negocio ${normalizedBusinessId}`
  );
};

export const isDeveloperRole = (role: unknown): boolean => {
  return hasDeveloperAccess(role);
};

interface ResolveBusinessDisplayNameParams {
  businessId?: string | null;
  candidateNames?: Array<unknown>;
  isDeveloperUser?: boolean;
}

export const resolveBusinessDisplayName = ({
  businessId,
  candidateNames = [],
  isDeveloperUser = false,
}: ResolveBusinessDisplayNameParams): string => {
  const normalizedBusinessId = toCleanString(businessId);

  for (const candidate of candidateNames) {
    const name = toCleanString(candidate);
    if (!name) continue;
    if (!isDeveloperUser && looksLikeIdLabel(name, normalizedBusinessId)) {
      continue;
    }
    return name;
  }

  if (isDeveloperUser && normalizedBusinessId) {
    return `Negocio ${normalizedBusinessId}`;
  }

  return 'Negocio sin nombre';
};

export const resolveBusinessDevIdLabel = ({
  businessId,
  isDeveloperUser,
}: {
  businessId?: string | null;
  isDeveloperUser: boolean;
}): string | null => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!isDeveloperUser || !normalizedBusinessId) return null;
  return `ID: ${normalizedBusinessId}`;
};
