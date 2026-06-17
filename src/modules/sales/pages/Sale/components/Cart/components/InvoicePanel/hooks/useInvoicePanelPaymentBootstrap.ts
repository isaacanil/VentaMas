import { useEffect, useRef } from 'react';

import { setPaymentMethod } from '@/features/cart/cartSlice';
import type { CartData, PaymentMethod } from '@/features/cart/types';
import { resolvePaymentMethodBootstrapUpdate } from '@/utils/payments/paymentMethodBootstrap';

interface UseInvoicePanelPaymentBootstrapArgs {
  cart: CartData;
  dispatch: (action: unknown) => void;
  invoicePanel: boolean;
  isAddedToReceivables: unknown;
  paymentMethods: PaymentMethod[];
}

export const useInvoicePanelPaymentBootstrap = ({
  cart,
  dispatch,
  invoicePanel,
  isAddedToReceivables,
  paymentMethods,
}: UseInvoicePanelPaymentBootstrapArgs) => {
  const didInitPaymentMethodsRef = useRef(false);

  useEffect(() => {
    if (!invoicePanel) {
      didInitPaymentMethodsRef.current = false;
      return;
    }

    if (didInitPaymentMethodsRef.current) return;
    didInitPaymentMethodsRef.current = true;

    const bootstrapMethod = resolvePaymentMethodBootstrapUpdate({
      isAddedToReceivables,
      paymentMethods,
      purchaseTotal: cart?.totalPurchase?.value || 0,
    });

    if (bootstrapMethod) {
      dispatch(setPaymentMethod(bootstrapMethod));
    }
  }, [
    cart?.totalPurchase?.value,
    dispatch,
    invoicePanel,
    isAddedToReceivables,
    paymentMethods,
  ]);
};
