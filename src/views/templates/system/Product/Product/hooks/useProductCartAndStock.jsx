import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

import { SelectProduct, SelectSettingCart } from "../../../../../../features/cart/cartSlice";
import { isStockExceeded, isStockRestricted, isStockZero } from "../utils/stock.utils";

/**
 * Hook personalizado para verificar si un producto está en el carrito
 * @param {string | number} productId - El ID del producto a verificar
 * @returns {{status: boolean, product: object | null}} - Estado y datos del producto seleccionado
 */
export const useProductInCart = (productId) => {
    const productsSelected = useSelector(SelectProduct);

    const selectedProduct = useMemo(() => {
        if (!Array.isArray(productsSelected)) {
            console.error('Expected an array from SelectProduct selector');
            return null;
        }

        if (typeof productId !== 'string' && typeof productId !== 'number') {
            console.error('Expected a string or number as the product ID');
            return null;
        }

        return productsSelected.find(item => item.id === productId) || null;
    }, [productsSelected, productId]);

    useEffect(() => {
        if (selectedProduct) { 
        //producto encontrado
        } else {
            // Producto no encontrado en el carrito
        }
    }, [selectedProduct]);

    return {
        status: !!selectedProduct,
        product: selectedProduct
    };
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProductStockStatus = (productInCart, originalProduct) => {
    // Read dynamic stock alert settings
    const settingsCart = useSelector(SelectSettingCart);
    const billing = settingsCart?.billing || {};
    const lowThreshold = useMemo(() => (
        Number.isFinite(billing?.stockLowThreshold) ? billing.stockLowThreshold : 20
    ), [billing?.stockLowThreshold]);
    const criticalThreshold = useMemo(() => (
        Number.isFinite(billing?.stockCriticalThreshold)
            ? billing.stockCriticalThreshold
            : Math.min(lowThreshold, 10)
    ), [billing?.stockCriticalThreshold, lowThreshold]);

    if (!productInCart && !originalProduct) {
        return { isLowStock: false, isCriticalStock: false, isOutOfStock: false };
    }

    const productToCheck = productInCart ?? originalProduct;
    const inCart = Boolean(productInCart);

    const remaining = (productToCheck?.stock ?? 0) - (productToCheck?.amountToBuy ?? 0);

    const criticalStock = useMemo(() => {
        if (!isStockRestricted(productToCheck)) return false;
        return remaining > 0 && remaining <= criticalThreshold;
    }, [productToCheck, remaining, criticalThreshold]);

    const lowStock = useMemo(() => {
        if (!isStockRestricted(productToCheck)) return false;
        // Low stock excludes critical range
        return remaining > criticalThreshold && remaining <= lowThreshold;
    }, [productToCheck, remaining, lowThreshold, criticalThreshold]);

    // Verifica si el producto está fuera de stock o si el carrito supera el stock disponible
    const outOfStock = useMemo(() => {
        if (!isStockRestricted(productToCheck)) return false;
        return (
            isStockExceeded(inCart, productToCheck) ||
            isStockZero(productToCheck)
        );
    }, [productToCheck, inCart]);

    return { isLowStock: lowStock, isCriticalStock: criticalStock, isOutOfStock: outOfStock };
};
