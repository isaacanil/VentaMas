import { useEffect, useRef } from 'react';

import { setPaymentMethod } from '@/features/cart/cartSlice';
import type { CartData, PaymentMethod } from '@/features/cart/types';

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

    const anyEnabled = paymentMethods.some((method) => method.status);
    const purchaseTotal = cart?.totalPurchase?.value || 0;

    if (!anyEnabled) {
      const defaultMethod =
        paymentMethods.find((method) => method.method === 'cash') ||
        paymentMethods[0];

      if (defaultMethod) {
        dispatch(
          setPaymentMethod({
            ...defaultMethod,
            status: true,
            value: isAddedToReceivables ? 0 : purchaseTotal,
          }),
        );
      }
      return;
    }

    const totalPaymentValue = paymentMethods.reduce(
      (sum, method) =>
        method.status ? sum + (Number(method.value) || 0) : sum,
      0,
    );

    if (!isAddedToReceivables && totalPaymentValue === 0 && purchaseTotal > 0) {
      const cashMethod = paymentMethods.find((method) => method.method === 'cash');
      if (cashMethod) {
        dispatch(
          setPaymentMethod({
            ...cashMethod,
            status: true,
            value: purchaseTotal,
          }),
        );
      }
    }
  }, [cart?.totalPurchase?.value, dispatch, invoicePanel, isAddedToReceivables, paymentMethods]);
};
