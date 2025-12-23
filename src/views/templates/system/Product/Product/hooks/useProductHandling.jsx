import { useState } from 'react';
import { useDispatch } from 'react-redux';

import {
    addProduct,
    deleteProduct,
} from '@/features/cart/cartSlice';
import { openProductStockSimple } from '@/features/productStock/productStockSimpleSlice';
import { getTotalPrice } from '@/utils/pricing';

import {
    useProductInCart,
    useProductStockStatus,
} from './useProductCartAndStock';

export const useProductHandling = (product, taxReceiptEnabled) => {
    const dispatch = useDispatch();
    const [productState, setProductState] = useState({
        imageHidden: false,
    });

    const { status: isProductInCart, product: productInCart } = useProductInCart(
        product?.id,
    );

    const { isLowStock, isCriticalStock, isOutOfStock } = useProductStockStatus(
        productInCart,
        product,
    );

    const price = getTotalPrice(product, taxReceiptEnabled);

    const deleteProductFromCart = (e) => {
        if (e) e.stopPropagation();
        if (isProductInCart && productInCart?.cid) {
            dispatch(deleteProduct(productInCart.cid));
        }
    };

    const handleGetThisProduct = (e) => {
        if (e) e.stopPropagation();

        if (isProductInCart) {
            deleteProductFromCart();
            return;
        }

        // Check if strict stock selection is required
        // If restrictSaleWithoutStock is true, we must open the batch/stock selector modal
        if (product?.restrictSaleWithoutStock) {
            dispatch(openProductStockSimple(product));
        } else {
            // Default behavior: add product directly
            dispatch(addProduct(product));
        }
    };

    return {
        productState,
        setProductState,
        isProductInCart,
        productInCart,
        isLowStock,
        isCriticalStock,
        isOutOfStock,
        price,
        handleGetThisProduct,
        deleteProductFromCart,
        isFirebaseLoading: false,
    };
};
