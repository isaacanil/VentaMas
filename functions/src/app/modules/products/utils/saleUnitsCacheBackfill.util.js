const DEFAULT_SALE_UNIT_NAME = 'Unidad';

const isRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value);

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toPositiveNumber = (value) => {
  const parsed = toFiniteNumber(value);
  return parsed != null && parsed > 0 ? parsed : null;
};

const roundInventoryQuantity = (value) =>
  Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;

export const readSaleUnitCacheId = (saleUnit, fallbackId = null) => {
  if (!isRecord(saleUnit)) return toCleanString(fallbackId);
  return toCleanString(
    saleUnit.id ?? saleUnit.unitId ?? saleUnit.saleUnitId ?? fallbackId,
  );
};

const normalizePricingForCache = (saleUnit) => {
  const rawPricing = isRecord(saleUnit.pricing) ? saleUnit.pricing : {};
  const price =
    toFiniteNumber(rawPricing.price) ??
    toFiniteNumber(rawPricing.listPrice) ??
    toFiniteNumber(saleUnit.price);
  const listPrice = toFiniteNumber(rawPricing.listPrice) ?? price;

  return {
    ...rawPricing,
    ...(price != null ? { price } : {}),
    ...(listPrice != null ? { listPrice } : {}),
  };
};

export const normalizeSaleUnitForProductCache = (
  saleUnit,
  fallbackId = null,
) => {
  if (!isRecord(saleUnit)) return null;

  const id = readSaleUnitCacheId(saleUnit, fallbackId);
  const conversionFactorToBase =
    toPositiveNumber(saleUnit.conversionFactorToBase) ??
    toPositiveNumber(saleUnit.quantity);

  if (!id || conversionFactorToBase == null) return null;

  return {
    ...saleUnit,
    id,
    unitName:
      toCleanString(
        saleUnit.unitName ??
          saleUnit.name ??
          saleUnit.unit ??
          saleUnit.label,
      ) ?? DEFAULT_SALE_UNIT_NAME,
    quantity: roundInventoryQuantity(conversionFactorToBase),
    conversionFactorToBase: roundInventoryQuantity(conversionFactorToBase),
    allowFractional: saleUnit.allowFractional === true,
    active: saleUnit.active !== false,
    pricing: normalizePricingForCache(saleUnit),
  };
};

export const normalizeSubcollectionSaleUnitsForCache = (
  subcollectionSaleUnits,
) => {
  const saleUnitsById = new Map();
  const duplicateIds = new Set();
  const invalidUnits = [];
  const saleUnits = Array.isArray(subcollectionSaleUnits)
    ? subcollectionSaleUnits
    : [];

  saleUnits.forEach((saleUnit, index) => {
    const id = readSaleUnitCacheId(saleUnit);
    const normalizedUnit = normalizeSaleUnitForProductCache(saleUnit, id);

    if (!normalizedUnit) {
      invalidUnits.push({
        index,
        id,
        reason: 'missing_id_or_positive_factor',
      });
      return;
    }

    if (saleUnitsById.has(normalizedUnit.id)) {
      duplicateIds.add(normalizedUnit.id);
    }
    saleUnitsById.set(normalizedUnit.id, normalizedUnit);
  });

  return {
    saleUnits: Array.from(saleUnitsById.values()),
    duplicateIds: Array.from(duplicateIds),
    invalidUnits,
  };
};

export const buildSaleUnitsCacheBackfill = ({
  product = {},
  subcollectionSaleUnits = [],
} = {}) => {
  const productData = isRecord(product) ? product : {};
  const embeddedSaleUnits = Array.isArray(productData.saleUnits)
    ? productData.saleUnits
    : [];
  const saleUnitsCount = toFiniteNumber(productData.saleUnitsCount);

  if (embeddedSaleUnits.length > 0) {
    const expectedCount = embeddedSaleUnits.length;
    if (saleUnitsCount !== expectedCount) {
      return {
        shouldUpdate: true,
        reason: 'sale_units_count_mismatch',
        patch: { saleUnitsCount: expectedCount },
        embeddedCount: expectedCount,
        subcollectionCount: Array.isArray(subcollectionSaleUnits)
          ? subcollectionSaleUnits.length
          : 0,
        invalidUnits: [],
        duplicateIds: [],
      };
    }

    return {
      shouldUpdate: false,
      reason: 'embedded_sale_units_present',
      patch: null,
      embeddedCount: expectedCount,
      subcollectionCount: Array.isArray(subcollectionSaleUnits)
        ? subcollectionSaleUnits.length
        : 0,
      invalidUnits: [],
      duplicateIds: [],
    };
  }

  const normalized = normalizeSubcollectionSaleUnitsForCache(
    subcollectionSaleUnits,
  );

  if (!normalized.saleUnits.length) {
    return {
      shouldUpdate: false,
      reason: 'no_valid_subcollection_sale_units',
      patch: null,
      embeddedCount: 0,
      subcollectionCount: Array.isArray(subcollectionSaleUnits)
        ? subcollectionSaleUnits.length
        : 0,
      invalidUnits: normalized.invalidUnits,
      duplicateIds: normalized.duplicateIds,
    };
  }

  return {
    shouldUpdate: true,
    reason: 'backfill_from_subcollection',
    patch: {
      saleUnits: normalized.saleUnits,
      saleUnitsCount: normalized.saleUnits.length,
    },
    embeddedCount: 0,
    subcollectionCount: Array.isArray(subcollectionSaleUnits)
      ? subcollectionSaleUnits.length
      : 0,
    invalidUnits: normalized.invalidUnits,
    duplicateIds: normalized.duplicateIds,
  };
};
