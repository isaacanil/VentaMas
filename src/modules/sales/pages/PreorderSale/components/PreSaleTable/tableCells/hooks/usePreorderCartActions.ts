import { useCallback } from 'react';
import { notification } from 'antd';
import type { NavigateFunction } from 'react-router-dom';

import {
  loadCart,
  setCartId,
  toggleInvoicePanelOpen,
} from '@/features/cart/cartSlice';
import { selectClientWithAuth } from '@/features/clientCart/clientCartSlice';
import { selectTaxReceiptType } from '@/features/taxReceipt/taxReceiptSlice';
import { flowTrace } from '@/utils/flowTrace';
import { validateInvoiceCart } from '@/utils/invoiceValidation';
import type { InvoiceData } from '@/types/invoice';

import type { ClientLike } from '../types';
import {
  convertTimestampsToMillis,
  normalizeClientForCart,
  resolvePreorderTaxReceiptType,
} from '../utils';

type UsePreorderCartActionsParams = {
  data: InvoiceData | null;
  dispatch: any;
  navigate: NavigateFunction;
};

export const usePreorderCartActions = ({
  data,
  dispatch,
  navigate,
}: UsePreorderCartActionsParams) => {
  const convertToCart = useCallback(
    (source: InvoiceData) => {
      const serializedPreorder = convertTimestampsToMillis(source) as InvoiceData;
      dispatch(loadCart(serializedPreorder));
      dispatch(setCartId(undefined));

      const storedTaxReceiptType = resolvePreorderTaxReceiptType(serializedPreorder);
      if (storedTaxReceiptType) {
        dispatch(selectTaxReceiptType(storedTaxReceiptType));
      }

      if (serializedPreorder?.client) {
        const normalizedClient = normalizeClientForCart(
          serializedPreorder.client as ClientLike,
        );
        if (normalizedClient) {
          dispatch(selectClientWithAuth(normalizedClient));
        }
      }

      return serializedPreorder;
    },
    [dispatch],
  );

  const handlePreloadPreorder = useCallback(() => {
    if (!data) return;

    const { isValid, message } = validateInvoiceCart(data);
    if (!isValid) {
      notification.warning({
        message: 'No se pudo precargar la preventa',
        description: message || 'Verifica el contenido antes de continuar.',
      });
      return;
    }

    void flowTrace('PREORDER_PRELOAD', { preorderId: data?.id });
    const serializedPreorder = convertToCart(data);
    const params = new URLSearchParams();
    params.set('mode', 'preorder');

    if (serializedPreorder?.id) {
      params.set('preorderId', String(serializedPreorder.id));
    }

    params.set('preserveCart', '1');
    navigate({ pathname: '/sales', search: `?${params.toString()}` });

    notification.success({
      message: 'Preventa precargada',
      description: `Se cargó la preventa ${serializedPreorder?.preorderDetails?.numberID || ''} en ventas.`,
    });
  }, [convertToCart, data, navigate]);

  const handleInvoicePanelOpen = useCallback(() => {
    if (!data) return;

    const { isValid, message } = validateInvoiceCart(data);
    if (isValid) {
      void flowTrace('PREORDER_OPEN_INVOICE_PANEL', { preorderId: data?.id });
      convertToCart(data);
      dispatch(toggleInvoicePanelOpen(undefined));
      return;
    }

    notification.error({
      description: message,
    });
  }, [convertToCart, data, dispatch]);

  return {
    convertToCart,
    handleInvoicePanelOpen,
    handlePreloadPreorder,
  };
};
