import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { addProduct, deleteProduct } from '../../../../../../features/cart/cartSlice';
import { useProductInCart, useProductStockStatus } from './useProductCartAndStock';

/**
 * Hook personalizado para manejar la lógica de un producto
 * @param {object} product - El producto a manejar
 * @param {boolean} taxReceiptEnabled - Si los recibos fiscales están habilitados
 * @returns {object} - Estado y funciones para manejar el producto
 */
export const useProductHandling = (product, taxReceiptEnabled) => {
   const dispatch = useDispatch();
   const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);

   const [productState, setProductState] = useState({
      imageHidden: false,
   });

   // Verificar si el producto está en el carrito
   const { status: isProductInCart, product: productInCart } = useProductInCart(product?.id);

   // Obtener el estado del stock
   const { isLowStock, isCriticalStock, isOutOfStock } = useProductStockStatus(
      productInCart,
      product
   );

   // Calcular el precio según si los recibos fiscales están habilitados
   const basePrice = product?.pricing?.price ?? 0;
   const taxPercent = product?.pricing?.tax ?? 0;
   const price = taxReceiptEnabled
      ? basePrice * (1 + taxPercent / 100)
      : basePrice;

   // Función para agregar el producto al carrito (o incrementar cantidad si ya existe)
   const handleGetThisProduct = () => {
      // Verificar restricciones de stock antes de agregar
      if (isOutOfStock && product?.restrictSaleWithoutStock) {
         return;
      }

      dispatch(addProduct(product));
   };

   // Función para eliminar el producto del carrito
   const deleteProductFromCart = () => {
      if (!isProductInCart || !productInCart) return;
      dispatch(deleteProduct(productInCart.cid));
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
