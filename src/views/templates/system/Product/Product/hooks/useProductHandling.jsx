import { notification } from 'antd';
import { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectUser } from '../../../../../../features/auth/userSlice';
import { addProduct, deleteProduct, SelectSettingCart } from '../../../../../../features/cart/cartSlice';
import { openProductStockSimple } from '../../../../../../features/productStock/productStockSimpleSlice';
import { getLocationName } from '../../../../../../firebase/warehouse/locationService';
import { useProductStockCheck } from '../../../../../../hooks/useProductStockCheck';
import { getTotalPrice } from '../../../../../../utils/pricing';
import { resolveStock } from "../utils/stock.utils";

import { useProductInCart, useProductStockStatus } from "./useProductCartAndStock";

export const useProductHandling = (product, taxReceiptEnabled) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [productState, setProductState] = useState({
    imageHidden: false,
    weightEntryModalOpen: false,
    isImageLoaded: false,
  });

  // Add refs to track if warnings have been shown
  const lowStockWarningShownRef = useRef(false);
  const criticalStockWarningShownRef = useRef(false);
  // NEW ref for no-stock reminder (only for non-strict products)
  const noStockReminderShownRef = useRef(false);

  const { status: isProductInCart, product: productInCart } = useProductInCart(product.id);
  const { isLowStock, isCriticalStock, isOutOfStock } = useProductStockStatus(productInCart, product);
  const { checkProductStock } = useProductStockCheck();

  // Dynamic billing settings for stock alerts
  const settingsCart = useSelector(SelectSettingCart) || {};
  const billing = settingsCart.billing || {};
  const alertsEnabled = !!billing.stockAlertsEnabled;
  const lowThreshold = Number.isFinite(billing.stockLowThreshold) ? billing.stockLowThreshold : 20;
  const criticalThreshold = Number.isFinite(billing.stockCriticalThreshold)
    ? billing.stockCriticalThreshold
    : Math.min(lowThreshold, 10);

  const price = useMemo(() => getTotalPrice(product, taxReceiptEnabled), [product, taxReceiptEnabled]);
  const productAvailableStock = useMemo(() => resolveStock(product), [product]);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);

  const normalizeExpirationDate = useCallback((value) => {
    if (!value) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    if (typeof value === 'object') {
      if (value.seconds !== undefined) {
        return value.seconds * 1000;
      }
      if (typeof value.toDate === 'function') {
        return value.toDate().getTime();
      }
    }
    return null;
  }, []);

  const handleGetThisProduct = useCallback(async () => {
    try {

      setIsFirebaseLoading(true);
      if (isOutOfStock) {
        if (alertsEnabled) {
          notification.warning({
            message: 'Alerta de Stock Agotado',
            description: `El stock de ${product.name} está agotado`,
          });
        }
        return;
      }
      // Critical stock notification has priority over low stock
      if (alertsEnabled && isCriticalStock && !criticalStockWarningShownRef.current) {
        notification.info({
          message: 'Stock Crítico',
          description: `Stock crítico de ${product.name}`,
        });
        criticalStockWarningShownRef.current = true;
      } else if (alertsEnabled && isLowStock && !isProductInCart && !lowStockWarningShownRef.current) {
        notification.warning({
          message: 'Alerta de Stock Bajo',
          description: `El stock de ${product.name} está por debajo de ${lowThreshold} unidades`,
        });
        lowStockWarningShownRef.current = true;
      }
      // NEW: Remind user when no stock exists (for non-strict stock products) only once.
      if (productAvailableStock <= 0 && !product?.restrictSaleWithoutStock && !noStockReminderShownRef.current) {
        noStockReminderShownRef.current = true;
      }
      // ...existing logic to handle product addition...
      if (productInCart?.productStockId && productInCart?.batchId) {
        dispatch(addProduct(productInCart));
        return;
      }
      if (productAvailableStock <= 0) {
        if (product?.weightDetail?.isSoldByWeight) {
          setProductState((prev) => ({ ...prev, weightEntryModalOpen: true }));
          return;
        }
        dispatch(addProduct({ ...product, stock: productAvailableStock, productStockId: null, batchId: null }));
        return;
      }
      const productStocks = await checkProductStock(product);
      if (productStocks.length === 0 && product?.restrictSaleWithoutStock) {
        if (alertsEnabled) {
          notification.info({
            message: 'Stock no disponible',
            description: `Para vender ${product.name} necesitas tener stock disponible.`,
          });
        }
        return;
      }
      if (productStocks.length > 1) {
        dispatch(openProductStockSimple(product));
        return;
      }
      if (productStocks.length === 1) {
        const [ps] = productStocks;
        let locationName = null;
        if (ps?.location && user) {
          try {
            locationName = await getLocationName(user, ps.location);
          } catch (error) {
            console.warn('No se pudo resolver el nombre de la ubicación:', error);
          }
        }

        const batchInfo = {
          productStockId: ps?.id ?? null,
          batchId: ps?.batchId ?? null,
          batchNumber: ps?.batchNumberId ?? null,
          quantity: ps?.quantity ?? null,
          expirationDate: normalizeExpirationDate(ps?.expirationDate),
          locationId: ps?.location ?? null,
          locationName: locationName ?? null,
        };

        dispatch(addProduct({
          ...product,
          productStockId: ps.id,
          batchId: ps.batchId,
          stock: ps?.quantity ?? productAvailableStock,
          batchInfo,
        }));
        return;
      }
      if (product?.weightDetail?.isSoldByWeight) {
        setProductState((prev) => ({ ...prev, weightEntryModalOpen: true }));
        return;
      }
      dispatch(addProduct({ ...product, stock: productAvailableStock, productStockId: null, batchId: null }));
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'No se pudo agregar el producto al carrito',
      });
      console.error('Error adding product:', error);
    } finally {
      setIsFirebaseLoading(false);
    }
  }, [
    product,
    isOutOfStock,
    isLowStock,
    isCriticalStock,
    productInCart,
    dispatch,
    checkProductStock,
    alertsEnabled,
    lowThreshold,
    criticalThreshold,
    normalizeExpirationDate,
    user,
    productAvailableStock,
  ]);

  const deleteProductFromCart = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      dispatch(deleteProduct(product.id));
    },
    [dispatch, product.id]
  );

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
