import type {
  ProductPricing,
  ProductRecord,
  ProductSaleUnit,
} from '@/types/products';
import { convertWeightToInventoryBaseQuantity } from '@/domain/products/weightUnits';

export const DEFAULT_SALE_UNIT_ID = 'default';
export const DEFAULT_SALE_UNIT_NAME = 'Unidad';

export type SaleUnitInput = {
  id?: string | null;
  unitName?: string | null;
  quantity?: unknown;
  conversionFactorToBase?: unknown;
  allowFractional?: unknown;
  active?: unknown;
  pricing?: ProductPricing | null;
};

export type SaleUnitSelection = SaleUnitInput | null | undefined;

type QuantityCarrier = {
  amountToBuy?: unknown;
  weightDetail?: {
    isSoldByWeight?: boolean;
    weight?: unknown;
    weightUnit?: unknown;
  } | null;
  selectedSaleUnit?: SaleUnitSelection;
  baseQuantity?: unknown;
};

const roundQuantity = (value: number): number =>
  Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;

export const toPositiveSaleUnitNumber = (
  value: unknown,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const resolveSaleUnitConversionFactor = (
  saleUnit: SaleUnitSelection,
): number =>
  roundQuantity(
    toPositiveSaleUnitNumber(
      saleUnit?.conversionFactorToBase,
      toPositiveSaleUnitNumber(saleUnit?.quantity, 1),
    ),
  );

export const normalizeSaleUnitForCart = (
  saleUnit: SaleUnitInput,
  price?: number | null,
): ProductSaleUnit => {
  const conversionFactorToBase = resolveSaleUnitConversionFactor(saleUnit);
  const pricing: ProductPricing = {
    ...saleUnit.pricing,
  };

  if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
    pricing.price = price;
  }

  return {
    ...saleUnit,
    id:
      typeof saleUnit.id === 'string' && saleUnit.id.trim()
        ? saleUnit.id
        : DEFAULT_SALE_UNIT_ID,
    unitName: saleUnit.unitName || DEFAULT_SALE_UNIT_NAME,
    quantity: conversionFactorToBase,
    conversionFactorToBase,
    allowFractional: saleUnit.allowFractional === true,
    active: saleUnit.active !== false,
    pricing,
  };
};

export const resolveSaleUnitLabel = (
  saleUnit: SaleUnitSelection,
): string | null => {
  if (!saleUnit) return null;
  const name = saleUnit.unitName || DEFAULT_SALE_UNIT_NAME;
  const factor = resolveSaleUnitConversionFactor(saleUnit);
  return factor === 1 ? name : `${name} x ${factor}`;
};

export const readCartLineAmount = (value: unknown): number => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as { total?: unknown; unit?: unknown };
    return toPositiveSaleUnitNumber(
      record.total,
      toPositiveSaleUnitNumber(record.unit, 1),
    );
  }
  return toPositiveSaleUnitNumber(value, 1);
};

export const resolveProductBaseQuantity = (
  product: QuantityCarrier | null | undefined,
): number => {
  if (!product) return 0;

  if (product.weightDetail?.isSoldByWeight === true) {
    return convertWeightToInventoryBaseQuantity({
      weight: product.weightDetail.weight,
      unit: product.weightDetail.weightUnit,
    });
  }

  const amountToBuy = readCartLineAmount(product.amountToBuy);
  const factor = resolveSaleUnitConversionFactor(product.selectedSaleUnit);
  return roundQuantity(amountToBuy * factor);
};

export const buildProductWithBaseQuantity = <T extends ProductRecord>(
  product: T,
): T & { baseQuantity: number } => ({
  ...product,
  baseQuantity: resolveProductBaseQuantity(product),
});
