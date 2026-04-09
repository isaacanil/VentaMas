import type {
  BusinessCreatedAt,
  BusinessDoc,
  BusinessFeedState,
  BusinessFilters,
  BusinessInfo,
  OwnerSource,
  SortBy,
  UnknownRecord,
} from '../types';

export const EMPTY_BUSINESSES: BusinessDoc[] = [];

export const INITIAL_BUSINESS_FILTERS: BusinessFilters = {
  province: '',
  country: '',
  businessType: '',
  hasRNC: false,
  sortBy: 'newest',
  ownerState: 'all',
  subscriptionStatus: '',
};

export const DEV_ONLY_ERROR =
  'Esta pantalla es de mantenimiento para desarrolladores y requiere rol dev.';

export const getInitialBusinessFeedState = (): BusinessFeedState => ({
  items: [],
  error: null,
  resolvedKey: null,
});

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};

const resolveString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const parsed = toCleanString(value);
    if (parsed) return parsed;
  }
  return null;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => toCleanString(item))
    .filter((item): item is string => Boolean(item));
};

const dedupeStrings = (values: string[]): string[] => {
  return Array.from(new Set(values));
};

const normalizeSubscriptionStatus = (value: unknown): string | null => {
  const status = toCleanString(value);
  return status ? status.toLowerCase() : null;
};

export const resolveCreatedAtSeconds = (
  createdAt?: BusinessCreatedAt,
): number => {
  if (!createdAt) return 0;

  if (typeof createdAt === 'string') {
    const parsed = Date.parse(createdAt);
    return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : 0;
  }

  if (createdAt instanceof Date) {
    return Math.floor(createdAt.getTime() / 1000);
  }

  if (typeof createdAt?.seconds === 'number') {
    return createdAt.seconds;
  }

  return 0;
};

const resolveOwnerData = (
  root: UnknownRecord,
  businessNode: UnknownRecord,
  nestedBusinessNode: UnknownRecord,
): {
  ownerUid: string | null;
  hasOwner: boolean;
  ownerSource: OwnerSource;
  ownerCandidates: string[];
} => {
  const explicitOwnerUid = resolveString(
    root.ownerUid,
    businessNode.ownerUid,
    nestedBusinessNode.ownerUid,
  );
  const owners = dedupeStrings([
    ...toStringArray(root.owners),
    ...toStringArray(businessNode.owners),
    ...toStringArray(nestedBusinessNode.owners),
  ]);

  if (explicitOwnerUid) {
    const ownerCandidates = dedupeStrings([explicitOwnerUid, ...owners]);
    return {
      ownerUid: explicitOwnerUid,
      hasOwner: true,
      ownerSource: 'ownerUid',
      ownerCandidates,
    };
  }

  if (owners.length) {
    return {
      ownerUid: owners[0],
      hasOwner: true,
      ownerSource: 'legacyOwners',
      ownerCandidates: owners,
    };
  }

  return {
    ownerUid: null,
    hasOwner: false,
    ownerSource: 'none',
    ownerCandidates: [],
  };
};

export const normalizeBusinessDoc = (value: unknown): BusinessDoc | null => {
  const root = asRecord(value);
  const businessNode = asRecord(root.business);
  const nestedBusinessNode = asRecord(businessNode.business);
  const rootSubscription = asRecord(root.subscription);
  const nestedSubscription = asRecord(businessNode.subscription);

  const id = resolveString(
    root.id,
    businessNode.id,
    nestedBusinessNode.id,
    root.businessID,
    root.businessId,
  );
  if (!id) return null;

  const ownerData = resolveOwnerData(root, businessNode, nestedBusinessNode);
  const createdAt =
    (root.createdAt as BusinessCreatedAt | undefined) ??
    (businessNode.createdAt as BusinessCreatedAt | undefined) ??
    (nestedBusinessNode.createdAt as BusinessCreatedAt | undefined);

  return {
    id,
    raw: root,
    business: {
      id,
      name:
        resolveString(root.name, businessNode.name, nestedBusinessNode.name) ||
        undefined,
      address:
        resolveString(
          root.address,
          businessNode.address,
          nestedBusinessNode.address,
        ) || undefined,
      tel:
        resolveString(root.tel, businessNode.tel, nestedBusinessNode.tel) ||
        undefined,
      email:
        resolveString(root.email, businessNode.email, nestedBusinessNode.email) ||
        undefined,
      rnc:
        resolveString(root.rnc, businessNode.rnc, nestedBusinessNode.rnc) ||
        undefined,
      province:
        resolveString(
          root.province,
          businessNode.province,
          nestedBusinessNode.province,
        ) || undefined,
      country:
        resolveString(
          root.country,
          businessNode.country,
          nestedBusinessNode.country,
        ) || undefined,
      businessType:
        resolveString(
          root.businessType,
          businessNode.businessType,
          nestedBusinessNode.businessType,
        ) || undefined,
      createdAt,
      ownerUid: ownerData.ownerUid,
      hasOwner: ownerData.hasOwner,
      ownerSource: ownerData.ownerSource,
      ownerCandidates: ownerData.ownerCandidates,
      subscriptionStatus:
        normalizeSubscriptionStatus(rootSubscription.status) ||
        normalizeSubscriptionStatus(nestedSubscription.status) ||
        null,
      subscriptionPlanId:
        resolveString(rootSubscription.planId, nestedSubscription.planId) ||
        null,
    },
  };
};

export const collectSortedBusinessFieldValues = (
  items: BusinessDoc[],
  selector: (item: BusinessDoc) => string | null | undefined,
): string[] => {
  return Array.from(
    new Set(
      items
        .map(selector)
        .filter((item): item is string => typeof item === 'string' && item.length > 0),
    ),
  ).sort();
};

export const filterBusinesses = (
  items: BusinessDoc[],
  searchTerm: string,
  filters: BusinessFilters,
) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return items.filter((item) => {
    const business = item.business;
    const searchMatches =
      !normalizedSearch ||
      business.id.toLowerCase().includes(normalizedSearch) ||
      (business.name && business.name.toLowerCase().includes(normalizedSearch)) ||
      (business.address &&
        business.address.toLowerCase().includes(normalizedSearch)) ||
      (business.tel && business.tel.toLowerCase().includes(normalizedSearch)) ||
      (business.email && business.email.toLowerCase().includes(normalizedSearch)) ||
      (business.rnc && business.rnc.toLowerCase().includes(normalizedSearch));
    const provinceMatches =
      !filters.province || business.province === filters.province;
    const countryMatches =
      !filters.country || business.country === filters.country;
    const businessTypeMatches =
      !filters.businessType || business.businessType === filters.businessType;
    const rncMatches = !filters.hasRNC || Boolean(business.rnc?.trim());
    const ownerMatches =
      filters.ownerState === 'all' ||
      (filters.ownerState === 'with_owner' ? business.hasOwner : !business.hasOwner);
    const subscriptionMatches =
      !filters.subscriptionStatus ||
      (business.subscriptionStatus || '') === filters.subscriptionStatus;

    return (
      searchMatches &&
      provinceMatches &&
      countryMatches &&
      businessTypeMatches &&
      rncMatches &&
      ownerMatches &&
      subscriptionMatches
    );
  });
};

export const sortBusinesses = (items: BusinessDoc[], sortBy: SortBy) => {
  return [...items].sort((a, b) => {
    const dateA = resolveCreatedAtSeconds(a.business.createdAt);
    const dateB = resolveCreatedAtSeconds(b.business.createdAt);
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });
};

export const getBusinessHealthStats = (items: BusinessDoc[]) => {
  const withOwner = items.filter((item) => item.business.hasOwner).length;
  const withSubscription = items.filter((item) =>
    Boolean(item.business.subscriptionStatus),
  ).length;
  const activeSubscription = items.filter((item) =>
    ['active', 'trialing'].includes(item.business.subscriptionStatus || ''),
  ).length;

  return {
    total: items.length,
    withOwner,
    missingOwner: items.length - withOwner,
    withSubscription,
    activeSubscription,
  };
};

export const paginateBusinesses = (
  items: BusinessDoc[],
  currentPage: number,
  itemsPerPage: number,
) => {
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const indexOfLastBusiness = currentPage * itemsPerPage;
  const indexOfFirstBusiness = indexOfLastBusiness - itemsPerPage;

  return {
    currentBusinesses: items.slice(indexOfFirstBusiness, indexOfLastBusiness),
    totalPages,
  };
};

export const hasAnyBusinessFilterApplied = (filters: BusinessFilters) => {
  return Boolean(
    filters.province ||
      filters.country ||
      filters.businessType ||
      filters.hasRNC ||
      filters.ownerState !== 'all' ||
      filters.subscriptionStatus,
  );
};
