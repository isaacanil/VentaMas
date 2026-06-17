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
  const previousReceivablesStatusRef = useRef(Boolean(isAddedToReceivables));

  useEffect(() => {
    const isReceivableSale = Boolean(isAddedToReceivables);

    if (!invoicePanel) {
      didInitPaymentMethodsRef.current = false;
      previousReceivablesStatusRef.current = isReceivableSale;
      return;
    }

    const shouldBootstrapOnOpen = !didInitPaymentMethodsRef.current;
    const shouldBootstrapReceivableTransition =
      didInitPaymentMethodsRef.current &&
      !previousReceivablesStatusRef.current &&
      isReceivableSale;

    if (!shouldBootstrapOnOpen && !shouldBootstrapReceivableTransition) {
      previousReceivablesStatusRef.current = isReceivableSale;
      return;
    }

    didInitPaymentMethodsRef.current = true;
    previousReceivablesStatusRef.current = isReceivableSale;

    const bootstrapMethod = resolvePaymentMethodBootstrapUpdate({
      isAddedToReceivables: isReceivableSale,
      paymentMethods,
      purchaseTotal: shouldBootstrapReceivableTransition
        ? 0
        : cart?.totalPurchase?.value || 0,
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
