import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { cartSlice, recalcTotals } from '@/features/cart/cartSlice';

export const totalsListener = createListenerMiddleware();

/* Acciones que deben disparar el recálculo (sin paymentValue) */
const basicRecalcActions = [
  cartSlice.actions.addProduct,
  cartSlice.actions.deleteProduct,
  cartSlice.actions.addAmountToProduct,
  cartSlice.actions.diminishAmountToProduct,
  cartSlice.actions.onChangeValueAmountToProduct,
  cartSlice.actions.changeProductPrice,
  cartSlice.actions.changeProductWeight,
  cartSlice.actions.addDiscount,
  cartSlice.actions.setPaymentMethod,
  cartSlice.actions.updateProductFields,
  cartSlice.actions.updateProductInsurance,
  cartSlice.actions.updateInsuranceStatus,
  cartSlice.actions.setClient,
  cartSlice.actions.loadCart,
  cartSlice.actions.resetCart,
];

/* Listener genérico (sin paymentValue) */
totalsListener.startListening({
  matcher: isAnyOf(...basicRecalcActions),
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(recalcTotals());
  },
});

totalsListener.startListening({
  actionCreator: cartSlice.actions.setPaymentAmount,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(recalcTotals(Number(action.payload)));
  },
});
