import {
  DEFAULT_SALE_UNIT_ID,
  DEFAULT_SALE_UNIT_NAME,
  normalizeSaleUnitForCart,
  resolveSaleUnitConversionFactor,
} from '@/domain/products/saleUnits';
import { shouldResolveProductPhysicalStock } from '@/domain/products/productInventoryLogic';
import type { SellableStockAvailabilityIndex } from './sellableStockAvailability';
import type { ProductRecord, ProductSaleUnit } from '@/types/products';

type BuildSaleUnitProductEntriesOptions = {
  stockAvailabilityByProductId?: SellableStockAvailabilityIndex;
  stockAvailabilityReady?: boolean;
  stockAvailabilityCanFilter?: boolean;
};

const hasSaleUnitIdentity = (saleUnit: ProductSaleUnit): boolean =>
  typeof saleUnit.id === 'string' &&
  saleUnit.id.trim().length > 0 &&
  saleUnit.id !== DEFAULT_SALE_UNIT_ID;

const isVisibleSaleUnit = (saleUnit: ProductSaleUnit): boolean =>
  saleUnit.active !== false && hasSaleUnitIdentity(saleUnit);

const isBaseUnitDuplicate = (saleUnit: ProductSaleUnit): boolean =>
  saleUnit.unitName === DEFAULT_SALE_UNIT_NAME &&
  resolveSaleUnitConversionFactor(saleUnit) === 1;

const canSellSaleUnitFromPhysicalStock = (
  product: ProductRecord,
  saleUnit: ProductSaleUnit,
  options: BuildSaleUnitProductEntriesOptions,
): boolean => {
  if (!shouldResolveProductPhysicalStock(product)) return true;

  const conversionFactor = resolveSaleUnitConversionFactor(saleUnit);
  if (conversionFactor <= 1) return true;
  if (options.stockAvailabilityReady !== true) return false;
  if (options.stockAvailabilityCanFilter !== true) return false;

  const productId = product.id ? String(product.id) : '';
  const availability = productId
    ? options.stockAvailabilityByProductId?.[productId]
    : null;

  return (
    Number(availability?.maxPhysicalStockQuantity ?? 0) >= conversionFactor
  );
};

const clearCartLineFields = (product: ProductRecord): ProductRecord => {
  const { amountToBuy, baseQuantity, cid, selectedSaleUnit, ...rest } =
    product as ProductRecord & { cid?: string };

  void amountToBuy;
  void baseQuantity;
  void cid;
  void selectedSaleUnit;

  return rest;
};

export const buildSaleUnitProductEntries = (
  product: ProductRecord,
  options: BuildSaleUnitProductEntriesOptions = {},
): ProductRecord[] => {
  const baseProduct: ProductRecord = {
    ...clearCartLineFields(product),
    selectedSaleUnit: null,
    selectedSaleUnitId: null,
  };

  if (!Array.isArray(product.saleUnits) || product.saleUnits.length === 0) {
    return [baseProduct];
  }

  const saleUnitEntries = product.saleUnits
    .map((saleUnit) => normalizeSaleUnitForCart(saleUnit))
    .filter(isVisibleSaleUnit)
    .filter((saleUnit) => !isBaseUnitDuplicate(saleUnit))
    .filter((saleUnit) =>
      canSellSaleUnitFromPhysicalStock(product, saleUnit, options),
    )
    .map((saleUnit) => ({
      ...clearCartLineFields(product),
      selectedSaleUnit: saleUnit,
      selectedSaleUnitId: saleUnit.id,
    }));

  return [baseProduct, ...saleUnitEntries];
};
