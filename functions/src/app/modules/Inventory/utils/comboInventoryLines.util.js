import { readSaleLineAmount } from './saleUnitQuantity.util.js';

const roundQuantity = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 1_000_000) / 1_000_000;

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normalizeId = (value) => {
  if (value == null) return '';
  return String(value).trim();
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeItemType = (...values) => {
  for (const value of values) {
    const normalized = normalizeId(value).toLowerCase();
    if (!normalized) continue;
    if (
      ['combo', 'combos', 'combinado', 'combinados', 'kit', 'bundle'].includes(
        normalized,
      ) ||
      normalized.includes('combo') ||
      normalized.includes('kit')
    ) {
      return 'combo';
    }
    if (['servicio', 'servicios', 'service', 'services'].includes(normalized)) {
      return 'service';
    }
    if (['producto', 'productos', 'product', 'products'].includes(normalized)) {
      return 'product';
    }
  }

  return '';
};

const normalizeComboComponents = (combo) => {
  const components = Array.isArray(combo.components) ? combo.components : [];
  const normalizedComponents = components
    .map((component, index) => {
      const record = asRecord(component);
      const productId = normalizeId(record.productId || record.idProduct);
      const quantity = toPositiveNumber(record.quantity);
      if (!productId || quantity <= 0) return null;

      return {
        id: normalizeId(record.id) || `component-${index + 1}`,
        productId,
        productName: normalizeId(record.productName || record.name),
        quantity,
        unitName: normalizeId(record.unitName) || null,
      };
    })
    .filter(Boolean);

  const componentsByProductId = new Map();
  for (const component of normalizedComponents) {
    const existing = componentsByProductId.get(component.productId);
    if (!existing) {
      componentsByProductId.set(component.productId, { ...component });
      continue;
    }

    existing.quantity = roundQuantity(existing.quantity + component.quantity);
    if (!existing.productName && component.productName) {
      existing.productName = component.productName;
    }
    if (!existing.unitName && component.unitName) {
      existing.unitName = component.unitName;
    }
  }

  return [...componentsByProductId.values()];
};

const getComboConfig = (cartLine, productData) => {
  const productCombo = asRecord(productData?.combo);
  const cartCombo = asRecord(cartLine?.combo);
  return normalizeComboComponents(cartCombo).length > 0
    ? cartCombo
    : productCombo;
};

export const getComboComponents = (cartLine, productData) => {
  const productCombo = asRecord(productData?.combo);
  const cartComponents = normalizeComboComponents(asRecord(cartLine?.combo));
  return cartComponents.length > 0
    ? cartComponents
    : normalizeComboComponents(productCombo);
};

export const isComponentTrackedCombo = (cartLine, productData) => {
  const combo = getComboConfig(cartLine, productData);
  const inventoryPolicy = combo.inventoryPolicy || 'components';
  const itemType = normalizeItemType(
    cartLine?.itemType,
    cartLine?.type,
    productData?.itemType,
    productData?.type,
  );

  return (
    itemType === 'combo' &&
    inventoryPolicy === 'components' &&
    getComboComponents(cartLine, productData).length > 0
  );
};

export const buildComboComponentInventoryLine = ({
  comboLine,
  comboProductData,
  component,
  componentIndex,
  componentProductData,
  parentLineId,
}) => {
  const comboQuantity = readSaleLineAmount(comboLine);
  const componentBaseQuantity = roundQuantity(
    comboQuantity * component.quantity,
  );
  const componentProduct = asRecord(componentProductData);
  const comboProduct = asRecord(comboProductData);
  const componentName =
    component.productName ||
    normalizeId(componentProduct.name || componentProduct.productName) ||
    component.productId;
  const parentComboName =
    normalizeId(comboLine?.name || comboProduct.name || comboProduct.productName) ||
    comboLine?.id ||
    null;

  return {
    id: component.productId,
    name: componentName,
    productName: componentName,
    itemType: componentProduct.itemType || 'product',
    amountToBuy: componentBaseQuantity,
    baseQuantity: componentBaseQuantity,
    selectedSaleUnit: null,
    selectedSaleUnitId: null,
    trackInventory: componentProduct.trackInventory !== false,
    restrictSaleWithoutStock:
      comboLine?.restrictSaleWithoutStock === true ||
      comboProduct.restrictSaleWithoutStock === true ||
      componentProduct.restrictSaleWithoutStock === true,
    lineId: `${parentLineId}::combo-component::${component.productId}::${
      component.id || componentIndex
    }`,
    cid: `${parentLineId}::combo-component::${component.productId}::${
      component.id || componentIndex
    }`,
    comboComponent: {
      id: component.id || null,
      productId: component.productId,
      productName: componentName,
      quantityPerCombo: component.quantity,
      requestedComboQuantity: comboQuantity,
      requestedBaseQuantity: componentBaseQuantity,
      parentComboId: comboLine?.id || null,
      parentComboName,
      parentLineId,
    },
  };
};
