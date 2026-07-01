// src/utils/invoiceValidation.js

import {
  resolveInvoiceProductQuantity,
  resolveInvoiceProductUnitPrice,
} from '@/utils/invoice/product';
import type { InvoiceProduct } from '@/types/invoice';
import { isSupportedWeightUnit } from '@/domain/products/weightUnits';

type InvoiceCartProductLike = {
  amountToBuy?: unknown;
  batchId?: unknown;
  name?: unknown;
  productName?: unknown;
  productStockId?: unknown;
  pricing?: {
    price?: unknown;
  };
  restrictSaleWithoutStock?: unknown;
  saleUnit?: unknown;
  selectedSaleUnit?: unknown;
  weightDetail?: {
    isSoldByWeight?: unknown;
    weight?: unknown;
    weightUnit?: unknown;
  } | null;
};

type InvoiceCartLike = {
  products?: InvoiceCartProductLike[] | null;
};

const getCartProducts = (cart?: InvoiceCartLike | null): InvoiceCartProductLike[] =>
  Array.isArray(cart?.products) ? cart.products : [];

const asInvoiceProduct = (product: InvoiceCartProductLike): InvoiceProduct =>
  product as unknown as InvoiceProduct;

export function hasProductsInInvoice(cart?: InvoiceCartLike | null) {
  return getCartProducts(cart).length > 0;
}

export function allProductsHaveValidQuantityInInvoice(cart?: InvoiceCartLike | null) {
  const products = getCartProducts(cart);
  if (!products.length) return false;

  return products.every((product) => {
    if (!product || typeof product !== 'object') return false;
    const amount = resolveInvoiceProductQuantity(asInvoiceProduct(product));
    return Number.isFinite(amount) && amount > 0;
  });
}

export function allWeightedProductsHaveValidWeightInInvoice(
  cart?: InvoiceCartLike | null,
) {
  const products = getCartProducts(cart);
  if (!products.length) return false;

  return products.every((product) => {
    if (!product || typeof product !== 'object') return false;
    if (product.weightDetail?.isSoldByWeight !== true) return true;
    const weight = Number(product.weightDetail?.weight);
    return Number.isFinite(weight) && weight > 0;
  });
}

export function allWeightedProductsHaveSupportedWeightUnitInInvoice(
  cart?: InvoiceCartLike | null,
) {
  const products = getCartProducts(cart);
  if (!products.length) return false;

  return products.every((product) => {
    if (!product || typeof product !== 'object') return false;
    if (product.weightDetail?.isSoldByWeight !== true) return true;
    return isSupportedWeightUnit(product.weightDetail?.weightUnit);
  });
}

export function meetsMinimumInvoiceRequirement(
  cart?: InvoiceCartLike | null,
  minimumRequiredAmount = 0,
) {
  const products = getCartProducts(cart);
  const totalAmount = products.reduce((acc, product) => {
    const invoiceProduct = asInvoiceProduct(product);
    const price = resolveInvoiceProductUnitPrice(invoiceProduct);
    const amount = resolveInvoiceProductQuantity(invoiceProduct);
    return acc + price * amount;
  }, 0);

  return totalAmount >= minimumRequiredAmount;
}

export function validateInvoiceCart(
  cart?: InvoiceCartLike | null,
  _minimumRequiredAmount?: number,
) {
  if (!cart) {
    return {
      isValid: false,
      message: 'Cart data is missing.',
    };
  }
  if (!('products' in cart)) {
    return {
      isValid: false,
      message: 'Cart products array is missing.',
    };
  }
  if (!Array.isArray(cart.products)) {
    return {
      isValid: false,
      message: 'Cart products must be an array.',
    };
  }
  if (!hasProductsInInvoice(cart)) {
    return {
      isValid: false,
      message: 'The invoice cart is empty. Please add products.',
    };
  }
  if (!allProductsHaveValidQuantityInInvoice(cart)) {
    return {
      isValid: false,
      message: 'One or more products have an invalid quantity (must be > 0).',
    };
  }
  if (!allWeightedProductsHaveValidWeightInInvoice(cart)) {
    return {
      isValid: false,
      message: 'One or more products sold by weight have an invalid weight (must be > 0).',
    };
  }
  if (!allWeightedProductsHaveSupportedWeightUnitInInvoice(cart)) {
    return {
      isValid: false,
      message:
        'Uno o más productos vendidos por peso tienen una unidad de peso no soportada. Selecciona kg, lb, oz, g o mg antes de facturar.',
    };
  }

  const productRequiringPhysicalSelection = cart.products.find((product) => {
    if (!product || typeof product !== 'object') return false;
    if (product.restrictSaleWithoutStock !== true) return false;
    return !product.productStockId || !product.batchId;
  });

  if (productRequiringPhysicalSelection) {
    const productName =
      typeof productRequiringPhysicalSelection.name === 'string' &&
      productRequiringPhysicalSelection.name.trim().length > 0
        ? productRequiringPhysicalSelection.name.trim()
        : typeof productRequiringPhysicalSelection.productName === 'string' &&
            productRequiringPhysicalSelection.productName.trim().length > 0
          ? productRequiringPhysicalSelection.productName.trim()
          : 'este producto';

    return {
      isValid: false,
      message: `Debes seleccionar la ubicación o existencia física de "${productName}" antes de facturar.`,
    };
  }

  return {
    isValid: true,
    message: 'Cart validation passed.',
  };
}
