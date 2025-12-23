import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { openProductStockSimple } from '@/features/productStock/productStockSimpleSlice';
import { getProductStockByProductId } from '@/firebase/warehouse/productStockService';

export const useProductStockCheck = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const checkProductStock = useCallback(
    async (product) => {
      try {
        const stockData = await getProductStockByProductId(user, {
          productId: product.id,
        });

        // Si hay más de una ubicación para el mismo producto
        if (stockData.length > 1) {
          dispatch(openProductStockSimple(product));
          return stockData;
        }
        return stockData;
      } catch (error) {
        console.error('Error checking product stock:', error);
        return false;
      }
    },
    [dispatch, user],
  );

  return { checkProductStock };
};
