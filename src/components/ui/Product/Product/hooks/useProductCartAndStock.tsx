import { useSelector } from 'react-redux';

import type { RootState } from '@/app/store';
import {
  selectCartProductByProductId,
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
  const selectedProduct = useSelector((state: RootState) =>
    selectCartProductByProductId(state, productId),
  ) as CartProductRecord | null;

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
  const billing = settingsCart?.billing;
  const lowThreshold = billing?.stockLowThreshold ?? 20;

  const criticalThreshold =
    billing?.stockCriticalThreshold ?? Math.min(lowThreshold, 10);

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
