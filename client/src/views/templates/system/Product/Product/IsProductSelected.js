import { useSelector } from 'react-redux';
import { SelectProduct } from '../../../../../features/cart/cartSlice';
import { useEffect, useMemo } from 'react';

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
            console.log('Producto no encontrado en el carrito.');
        }
    }, [selectedProduct]);

    return {
        status: !!selectedProduct,
        product: selectedProduct
    };
};

const isStockRestricted = (product) => product?.restrictSaleWithoutStock;
const isStockExceeded = (product, productInCart) => {
    const totalAmountToBuy = productInCart?.amountToBuy || 0;
    return totalAmountToBuy >= product?.stock;
  };
  
const isStockCero = (product) => product?.stock <= 0;
const isStockLow = (product, productInCart) => {
    const totalAmountToBuy = productInCart?.amountToBuy || 0
    const remainingStock = product?.stock - totalAmountToBuy;
    return remainingStock < 20 && remainingStock > 0;
  };
  

export const useProductStockStatus = (product, productInCart) => {
    // Verifica si el stock es bajo (por debajo del umbral de 20 unidades)
    const isLowStock = useMemo(() => {
        if (!isStockRestricted(product)) return false;
        return isStockLow(product, productInCart);
    }, [product, productInCart]);

    // Verifica si el producto está fuera de stock o si el carrito supera el stock disponible
    const isOutOfStock = useMemo(() => {
        if (!isStockRestricted(product)) return false;
        return isStockExceeded(product, productInCart) || isStockCero(product);
    }, [product, productInCart]);
 
    return { isLowStock, isOutOfStock };
};