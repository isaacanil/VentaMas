import {
  convertWeightToInventoryBaseQuantity,
} from './weightUnit.util.js';

const roundQuantity = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 1_000_000) / 1_000_000;

const toPositiveNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const readSaleLineAmount = (product) => {
  const amount = product?.amountToBuy;
  if (amount && typeof amount === 'object' && !Array.isArray(amount)) {
    if (product?.selectedSaleUnit || product?.saleUnit) {
      return (
        toPositiveNumber(amount.unit) ??
        toPositiveNumber(amount.value) ??
        toPositiveNumber(amount.quantity) ??
        toPositiveNumber(amount.total) ??
        0
      );
    }

    return (
      toPositiveNumber(amount.total) ??
      toPositiveNumber(amount.unit) ??
      toPositiveNumber(amount.value) ??
      0
    );
  }
  return toPositiveNumber(amount, 0);
};

export const resolveSaleUnitConversionFactor = (product) => {
  const unit = product?.selectedSaleUnit || product?.saleUnit || null;
  return roundQuantity(
    toPositiveNumber(
      unit?.conversionFactorToBase,
      toPositiveNumber(unit?.quantity, 1),
    ),
  );
};

export const resolveInventoryBaseQuantity = (product) => {
  if (!product || typeof product !== 'object') return 0;

  if (product?.weightDetail?.isSoldByWeight === true) {
    return convertWeightToInventoryBaseQuantity({
      weight: product?.weightDetail?.weight,
      unit: product?.weightDetail?.weightUnit,
    });
  }

  const expectedBaseQuantity = roundQuantity(
    readSaleLineAmount(product) * resolveSaleUnitConversionFactor(product),
  );
  const providedBaseQuantity = toPositiveNumber(product?.baseQuantity);

  if (
    providedBaseQuantity != null &&
    Math.abs(providedBaseQuantity - expectedBaseQuantity) <= 0.000001
  ) {
    return providedBaseQuantity;
  }

  return expectedBaseQuantity;
};

export const buildSaleUnitMovementSnapshot = (product) => {
  const unit = product?.selectedSaleUnit || product?.saleUnit || null;
  if (!unit) return null;

  return {
    saleUnitId: unit.id || null,
    saleUnitName: unit.unitName || null,
    barcode: unit.barcode || unit.qrcode || unit.qrCode || unit.sku || null,
    saleQuantity: readSaleLineAmount(product),
    conversionFactorToBase: resolveSaleUnitConversionFactor(product),
    pricing: unit.pricing
      ? {
          currency: unit.pricing.currency || null,
          price: unit.pricing.price ?? null,
          listPrice: unit.pricing.listPrice ?? null,
          tax: unit.pricing.tax ?? null,
        }
      : null,
  };
};
