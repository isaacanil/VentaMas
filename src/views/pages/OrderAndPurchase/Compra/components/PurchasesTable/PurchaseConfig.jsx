import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { getPendingPurchaseFromDB } from '@/features/purchase/addPurchaseSlice';

export const SetPendingPurchaseInState = (purchase) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (Array.isArray(purchase) && purchase.length > 0) {
      dispatch(
        getPendingPurchaseFromDB({
          optionsID: 'Pedidos',
          datas: purchase,
          propertyName: 'data',
        }),
      );
    }
  }, [dispatch, purchase]);
};
