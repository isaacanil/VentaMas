import type { MissingBusiness } from '../types';

const EMPTY_BUSINESS_NAME = '(sin nombre)';

const getBusinessPayload = (data: Record<string, unknown>) => {
  return typeof data.business === 'object' && data.business !== null
    ? (data.business as Record<string, unknown>)
    : {};
};

export const normalizeBusinessMissingCreatedAt = (
  id: string,
  data: Record<string, unknown>,
): MissingBusiness => {
  const business = getBusinessPayload(data);
  const createdAtNested = business.createdAt ?? null;
  const createdAtRoot = data.createdAt ?? null;
  const effectiveCreatedAt = createdAtNested || createdAtRoot;
  const name =
    typeof business.name === 'string' && business.name.trim()
      ? business.name
      : EMPTY_BUSINESS_NAME;

  return {
    id,
    name,
    createdAt: effectiveCreatedAt,
    raw: data,
    hasCreatedAtNested: Boolean(createdAtNested),
    hasCreatedAtRoot: Boolean(createdAtRoot),
  };
};

export const isMissingNestedCreatedAt = (business: MissingBusiness) => {
  return !business.hasCreatedAtNested;
};
