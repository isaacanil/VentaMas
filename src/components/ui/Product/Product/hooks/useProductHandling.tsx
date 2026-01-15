import { App } from 'antd';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
    addProduct,
    deleteProduct,
    addAmountToProduct,
} from '@/features/cart/cartSlice';
import { openProductStockSimple } from '@/features/productStock/productStockSimpleSlice';
import { getLocationName } from '@/firebase/warehouse/locationService';
import { getProductStockByProductId } from '@/firebase/warehouse/productStockService';
import { toMillis } from '@/utils/date/toMillis';
import { buildLocationPath } from '@/utils/inventory/locations';
import { getTotalPrice } from '@/utils/pricing';
import type { CartProductRecord, ProductRecord } from '@/types/products';
import type { InventoryStockItem } from '@/utils/inventory/types';
import type { UserIdentity } from '@/types/users';

import {
    useProductInCart,
    useProductStockStatus,
} from './useProductCartAndStock';

type ProductState = {
    imageHidden: boolean;
    isImageLoaded?: boolean;
};

export const useProductHandling = (
    product: ProductRecord,
    taxReceiptEnabled: boolean,
) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser) as UserIdentity | null;
    const { notification } = App.useApp();

    const [productState, setProductState] = useState<ProductState>({
        imageHidden: false,
    });

    const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);

    const { status: isProductInCart, product: productInCart } = useProductInCart(
        product?.id,
    );

    const { isLowStock, isCriticalStock, isOutOfStock } = useProductStockStatus(
        productInCart,
        product,
    );

    const price = getTotalPrice(product, taxReceiptEnabled);

    const deleteProductFromCart = (e?: MouseEvent) => {
        if (e) e.stopPropagation();
        if (isProductInCart && productInCart?.cid) {
            dispatch(deleteProduct(productInCart.cid));
        }
    };

    const handleGetThisProduct = async (e?: MouseEvent) => {
        if (e) e.stopPropagation();

        if (!user) return;

        if (isProductInCart) {
            // Check stock limit for current batch
            const currentStock = Number(productInCart?.stock);
            const currentAmount = Number(productInCart?.amountToBuy || 0);

            if (Number.isFinite(currentStock) && currentAmount >= currentStock) {
                notification.warning({
                    message: 'Cantidad máxima alcanzada',
                    description: `No puedes agregar más unidades. El stock disponible es ${currentStock}.`,
                    placement: 'bottomRight',
                });
                return;
            }

            // If already in cart and under limit, add quantity
            dispatch(addAmountToProduct({ id: product.id }));
            return;
        }

        // Always check stock availability to determine if we need to show the modal
        setIsFirebaseLoading(true);
        try {
            const stocks = (await getProductStockByProductId(user as InventoryUser, {
                productId: product.id,
            })) as InventoryStockItem[];
            // Filter only positive quantity stocks to decide auto-selection
            const availableStocks = stocks.filter(s => (Number(s.quantity) || 0) > 0);

            // CASE 1: No Available Stocks
            if (availableStocks.length === 0) {
                if (product?.restrictSaleWithoutStock) {
                    notification.warning({
                        message: 'Sin disponibilidad',
                        description: 'Este producto no tiene existencias disponibles.',
                        placement: 'bottomRight',
                    });
                } else {
                    // Non-strict: just add the product directly
                    dispatch(addProduct(product));
                }
                return;
            }

            // CASE 2: Exactly One Available Stock
            if (availableStocks.length === 1) {
                const chosenStock = availableStocks[0];
                const expirationTimestamp = toMillis(chosenStock.expirationDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isExpired = expirationTimestamp !== undefined && expirationTimestamp < today.getTime();

                // If expired, we might want to show the modal so user sees it's expired
                // If NOT expired, auto-select it.
                if (!isExpired) {
                    const locationPath = buildLocationPath(chosenStock.location);
                    const locationName = locationPath
                        ? await getLocationName(user as InventoryUser, locationPath)
                        : '';
                    const batchInfo = {
                        productStockId: chosenStock.id ?? null,
                        batchId: chosenStock.batchId ?? null,
                        batchNumber: chosenStock.batchNumberId ?? null,
                        quantity: chosenStock.quantity ?? null,
                        expirationDate: expirationTimestamp ?? null,
                        locationId: locationPath || null,
                        locationName: locationName || null,
                    };

                    dispatch(
                        addProduct({
                            ...product,
                            productStockId: batchInfo.productStockId,
                            batchId: batchInfo.batchId,
                            stock: chosenStock.quantity,
                            batchInfo,
                        }),
                    );
                    return;
                }
            }

            // CASE 3: Multiple Stocks OR Single Expired Stock
            // Open the modal for the user to choose
            dispatch(openProductStockSimple(product));

        } catch (error) {
            console.error('Error fetching product stocks:', error);
            // Fallback on error:
            // If restrictSaleWithoutStock, we probably should show the modal (it might be empty or show error there)
            // Or just try to add it if not strict.
            if (product?.restrictSaleWithoutStock) {
                dispatch(openProductStockSimple(product));
            } else {
                dispatch(addProduct(product));
            }
        } finally {
            // Keep loading state briefly for smooth UX
            setTimeout(() => setIsFirebaseLoading(false), 300);
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
        isFirebaseLoading,
    };
};
