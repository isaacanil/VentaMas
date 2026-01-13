import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
  SelectProduct,
  SelectSettingCart,
} from '@/features/cart/cartSlice';

import {
  isStockExceeded,
  isStockRestricted,
  isStockZero,
  resolveStock,
} from '../utils/stock.utils';
import type { CartProductRecord, ProductRecord } from '@/types/products';

/**
 * Hook personalizado para verificar si un producto está en el carrito
 * @param {string | number} productId - El ID del producto a verificar
 * @returns {{status: boolean, product: object | null}} - Estado y datos del producto seleccionado
 */
export const useProductInCart = (productId?: string | number | null) => {
  const productsSelected = useSelector(SelectProduct) as CartProductRecord[];

  const selectedProduct = (() => {
    if (!Array.isArray(productsSelected)) {
      console.error('Expected an array from SelectProduct selector');
      return null;
    }

    if (typeof productId !== 'string' && typeof productId !== 'number') {
      console.error('Expected a string or number as the product ID');
      return null;
    }

    return productsSelected.find((item) => item.id === productId) || null;
  })();

  useEffect(() => {
    if (selectedProduct) {
      //producto encontrado
    } else {
      // Producto no encontrado en el carrito
    }
  }, [selectedProduct]);

  return {
    status: !!selectedProduct,
    product: selectedProduct,
  };
};

export const useProductStockStatus = (
  productInCart?: CartProductRecord | null,
  originalProduct?: ProductRecord | null,
) => {
  // Read dynamic stock alert settings
  const settingsCart = useSelector(SelectSettingCart) as {
    billing?: {
      stockLowThreshold?: number;
      stockCriticalThreshold?: number;
    };
  };
  const billing = settingsCart?.billing || {};
  const lowThreshold = Number.isFinite(billing?.stockLowThreshold)
    ? billing.stockLowThreshold
    : 20;

  const criticalThreshold = Number.isFinite(billing?.stockCriticalThreshold)
    ? billing.stockCriticalThreshold
    : Math.min(lowThreshold, 10);

  if (!productInCart && !originalProduct) {
    return { isLowStock: false, isCriticalStock: false, isOutOfStock: false };
  }

  const productToCheck: CartProductRecord | ProductRecord | null =
    productInCart ?? originalProduct ?? null;
  const inCart = Boolean(productInCart);

  const availableStock = resolveStock(productToCheck);
  const remaining = availableStock - (productToCheck?.amountToBuy ?? 0);

  const criticalStock = (() => {
    if (!isStockRestricted(productToCheck)) return false;
    return remaining > 0 && remaining <= criticalThreshold;
  })();

  const lowStock = (() => {
    if (!isStockRestricted(productToCheck)) return false;
    // Low stock excludes critical range
    return remaining > criticalThreshold && remaining <= lowThreshold;
  })();

  // Verifica si el producto está fuera de stock o si el carrito supera el stock disponible
  const outOfStock = (() => {
    if (!isStockRestricted(productToCheck)) return false;
    return (
      isStockExceeded(inCart, productToCheck) || isStockZero(productToCheck)
    );
  })();

  return {
    isLowStock: lowStock,
    isCriticalStock: criticalStock,
    isOutOfStock: outOfStock,
  };
};
