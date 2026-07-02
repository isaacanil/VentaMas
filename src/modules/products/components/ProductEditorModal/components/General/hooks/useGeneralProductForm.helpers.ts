import {
  normalizeComboComponents,
  normalizeItemType,
  normalizeProductInventoryRole,
  normalizeTrackInventoryValue,
  withRawMaterialDefaults,
  withServiceDefaults,
} from '@/domain/products/normalization';
import { PRODUCT_BRAND_DEFAULT } from '@/domain/products/productDefaults';
import { normalizeSaleUnitForCart } from '@/domain/products/saleUnits';
import type {
  ProductComboConfig,
  ProductRecord,
  ProductSaleUnit,
} from '@/types/products';

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

const readComboValue = (
  changeValue: Partial<ProductRecord>,
  allValues?: Partial<ProductRecord>,
): ProductRecord['combo'] => {
  if (allValues?.combo && typeof allValues.combo === 'object') {
    return allValues.combo;
  }
  if (changeValue.combo && typeof changeValue.combo === 'object') {
    return changeValue.combo;
  }
  return null;
};

export const normalizeComboConfigForModal = (
  combo: ProductRecord['combo'],
): ProductComboConfig => ({
  enabled: true,
  inventoryPolicy: 'components',
  components: normalizeComboComponents(combo?.components),
});

export const normalizeComboChangeForModal = (
  changeValue: Partial<ProductRecord>,
  allValues?: Partial<ProductRecord>,
): ProductComboConfig =>
  normalizeComboConfigForModal(readComboValue(changeValue, allValues));

export const withComboInventoryPolicyForSubmit = (
  product: ProductRecord,
): ProductRecord => {
  if (product?.itemType !== 'combo') {
    return product?.combo == null ? product : { ...product, combo: null };
  }
  return {
    ...product,
    combo: normalizeComboConfigForModal(product.combo),
  };
};

export const buildInventoryRoleChangePatchForModal = (
  value: unknown,
  product: ProductRecord | null | undefined,
): Partial<ProductRecord> => {
  const itemType = normalizeItemType(product?.itemType, product?.type);
  const inventoryRole = normalizeProductInventoryRole(value, itemType);

  if (inventoryRole === 'raw_material') {
    return withRawMaterialDefaults({
      ...(product as ProductRecord),
      itemType: 'product',
      inventoryRole,
    } as ProductRecord);
  }

  return {
    inventoryRole: null,
    isSellable: true,
    isVisible: true,
    trackInventory: normalizeTrackInventoryValue(
      product?.trackInventory,
      'product',
    ),
    restrictSaleWithoutStock: product?.restrictSaleWithoutStock ?? false,
  };
};

export const buildItemTypeChangePatchForModal = (
  value: unknown,
  product: ProductRecord | null | undefined,
): Partial<ProductRecord> => {
  const itemType = normalizeItemType(value);
  const trackInventory =
    itemType === 'combo'
      ? true
      : itemType === 'service'
        ? false
        : normalizeTrackInventoryValue(product?.trackInventory, itemType);

  const patch: Partial<ProductRecord> = {
    itemType,
    inventoryRole: null,
    isSellable: true,
    trackInventory,
    combo: null,
  };

  if (itemType === 'combo') {
    return {
      ...patch,
      brand: PRODUCT_BRAND_DEFAULT,
      brandId: null,
      netContent: '',
      size: '',
      activeIngredients: '',
      measurement: '',
      footer: '',
      stock: 0,
      totalUnits: null,
      packSize: 1,
      isSellable: true,
      isVisible: true,
      saleUnits: [],
      selectedSaleUnit: null,
      selectedSaleUnitId: null,
      restrictSaleWithoutStock: true,
      weightDetail: {
        ...product?.weightDetail,
        isSoldByWeight: false,
      },
      warranty: {
        ...product?.warranty,
        status: false,
      },
      combo: normalizeComboConfigForModal(product?.combo),
    };
  }

  if (itemType === 'service') {
    return withServiceDefaults({
      ...(product as ProductRecord),
      ...patch,
      itemType: 'service',
    } as ProductRecord);
  }

  return patch;
};
