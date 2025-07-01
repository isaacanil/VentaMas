import { useRef, useState, useMemo, useCallback } from "react"; 
import { useDispatch } from "react-redux";
import { notification } from 'antd'; 
import { addProduct, deleteProduct } from '../../../../../../features/cart/cartSlice'; 
import { openProductStockSimple } from '../../../../../../features/productStock/productStockSimpleSlice'; 
import { useProductStockCheck } from '../../../../../../hooks/useProductStockCheck'; 
import { getTotalPrice } from '../../../../../../utils/pricing'; 
import { useProductInCart, useProductStockStatus } from "./useProductCartAndStock";
export const useProductHandling = (product, taxReceiptEnabled) => {
  const dispatch = useDispatch();
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
  const { isLowStock, isOutOfStock } = useProductStockStatus(productInCart, product);
  const { checkProductStock } = useProductStockCheck();

  const price = useMemo(() => getTotalPrice(product, taxReceiptEnabled), [product, taxReceiptEnabled]);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);

  const handleGetThisProduct = useCallback(async () => {
    try {
 
      setIsFirebaseLoading(true);
      if (isOutOfStock) {
        notification.warning({
          message: 'Alerta de Stock Agotado',
          description: `El stock de ${product.name} está agotado`,
        });
        return;
      }
      // Show low-stock notification only once when not already selected
      if (isLowStock && !isProductInCart && !lowStockWarningShownRef.current) {
        notification.warning({
          message: 'Alerta de Stock Bajo',
          description: `El stock de ${product.name} está por debajo de 20 unidades`,
        });
        lowStockWarningShownRef.current = true;
      }
      // Additionally, warn when stock reaches 5 units (only once)
      if (product.stock === 5 && !criticalStockWarningShownRef.current) {
        notification.info({
          message: 'Stock Crítico',
          description: `Solo quedan 5 unidades de ${product.name}`,
        });
        criticalStockWarningShownRef.current = true;
      }
      // NEW: Remind user when no stock exists (for non-strict stock products) only once.
      if ((!product?.stock || product.stock <= 0) && !product?.restrictSaleWithoutStock && !noStockReminderShownRef.current) {
        noStockReminderShownRef.current = true;
      }
      // ...existing logic to handle product addition...
      if (productInCart?.productStockId && productInCart?.batchId) {
        dispatch(addProduct(productInCart));
        return;
      }
      if (!product?.stock || product.stock <= 0) {
        if (product?.weightDetail?.isSoldByWeight) {
          setProductState((prev) => ({ ...prev, weightEntryModalOpen: true }));
          return;
        }
        dispatch(addProduct({ ...product, productStockId: null, batchId: null }));
        return;
      }
      const productStocks = await checkProductStock(product);
      if (productStocks.length === 0 && product?.restrictSaleWithoutStock) {
        notification.info({
          message: 'Stock no disponible',
          description: `Para vender ${product.name} necesitas tener stock disponible.`,
        });
        return;
      }
      if (productStocks.length > 1) {
        dispatch(openProductStockSimple(product));
        return;
      }
      if (productStocks.length === 1) {
        const [ps] = productStocks;
        dispatch(addProduct({ ...product, productStockId: ps.id, batchId: ps.batchId }));
        return;
      }
      if (product?.weightDetail?.isSoldByWeight) {
        setProductState((prev) => ({ ...prev, weightEntryModalOpen: true }));
        return;
      }
      dispatch(addProduct({ ...product, productStockId: null, batchId: null }));
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
    productInCart,
    dispatch,
    checkProductStock,
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
    isOutOfStock,
    price,
    handleGetThisProduct,
    deleteProductFromCart,
    isFirebaseLoading,
  };
};