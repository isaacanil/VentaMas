import { useSelector } from 'react-redux';

import type { RootState } from '@/app/store';
import {
  SelectSettingCart,
  SelectProduct,
} from '@/features/cart/cartSlice';
import { sumCartBaseQuantityForPhysicalStock } from '@/modules/sales/pages/Sale/utils/cartPhysicalStockUsage';

import {
  isStockExceeded,
  isStockInsufficientForNextUnit,
  isStockRestricted,
  isStockZero,
  resolveRemainingStockForStatus,
} from '../utils/stock.utils';
import type { CartProductRecord, ProductRecord } from '@/types/products';

/**
 * Hook personalizado para verificar si un producto está en el carrito
 * @param {string | number} productId - El ID del producto a verificar
 * @returns {{status: boolean, product: object | null}} - Estado y datos del producto seleccionado
 */
export const useProductInCart = (product?: ProductRecord | null) => {
  const productId = product?.id;
  const saleUnitId = String(product?.selectedSaleUnit?.id ?? 'default');
  const selectedProduct = useSelector((state: RootState) => {
    if (typeof productId !== 'string' && typeof productId !== 'number') {
      return null;
    }

    return (
      state.cart.data.products.find(
        (cartProduct) =>
          cartProduct.id === productId &&
          String(cartProduct.selectedSaleUnit?.id ?? 'default') === saleUnitId,
      ) ?? null
    );
  }) as unknown as CartProductRecord | null;

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
  const cartProducts = useSelector(SelectProduct) as CartProductRecord[];
  const billing = settingsCart?.billing;
  const lowThreshold = billing?.stockLowThreshold ?? 20;

  const criticalThreshold =
    billing?.stockCriticalThreshold ?? Math.min(lowThreshold, 10);

  if (!productInCart && !originalProduct) {
    return { isLowStock: false, isCriticalStock: false, isOutOfStock: false };
  }

  const accumulatedPhysicalBaseQuantity = productInCart
    ? sumCartBaseQuantityForPhysicalStock(cartProducts, productInCart)
    : 0;
  const productToCheck: CartProductRecord | ProductRecord | null =
    productInCart && accumulatedPhysicalBaseQuantity > 0
      ? {
          ...productInCart,
          baseQuantity: accumulatedPhysicalBaseQuantity,
        }
      : (productInCart ?? originalProduct ?? null);
  const inCart = Boolean(productInCart);

  const remaining = resolveRemainingStockForStatus(inCart, productToCheck);

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
      isStockExceeded(inCart, productToCheck) ||
      isStockZero(productToCheck) ||
      (!inCart && isStockInsufficientForNextUnit(productToCheck))
    );
  })();

  return {
    isLowStock: lowStock,
    isCriticalStock: criticalStock,
    isOutOfStock: outOfStock,
  };
};
