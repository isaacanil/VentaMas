import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { cartSlice, recalcTotals } from '@/features/cart/cartSlice';

export const totalsListener = createListenerMiddleware();

/* Acciones que deben disparar el recálculo (sin paymentValue) */
type CartActionCreator =
  (typeof cartSlice.actions)[keyof typeof cartSlice.actions];

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
] as const satisfies ReadonlyArray<CartActionCreator>;

const isBasicRecalcAction = isAnyOf(...basicRecalcActions);

/* Listener genérico (sin paymentValue) */
totalsListener.startListening({
  matcher: isBasicRecalcAction,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(recalcTotals(undefined));
  },
});

totalsListener.startListening({
  actionCreator: cartSlice.actions.setPaymentAmount,
  effect: async (action, listenerApi) => {
    listenerApi.dispatch(recalcTotals(Number(action.payload)));
  },
});
