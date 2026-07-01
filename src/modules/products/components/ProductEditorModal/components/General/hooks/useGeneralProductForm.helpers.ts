import { normalizeSaleUnitForCart } from '@/domain/products/saleUnits';
import type { ProductRecord, ProductSaleUnit } from '@/types/products';

export const normalizeSaleUnitsChangeForModal = (
  changeValue: Partial<ProductRecord>,
  allValues?: Partial<ProductRecord>,
): ProductSaleUnit[] => {
  const nextSaleUnits = Array.isArray(allValues?.saleUnits)
    ? allValues.saleUnits
    : Array.isArray(changeValue.saleUnits)
      ? changeValue.saleUnits
      : [];

  return nextSaleUnits.map((unit) => normalizeSaleUnitForCart(unit));
};
