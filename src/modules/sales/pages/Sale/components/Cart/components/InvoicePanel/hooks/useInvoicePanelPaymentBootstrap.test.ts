import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { setPaymentMethod } from '@/features/cart/cartSlice';
import type { CartData, PaymentMethod } from '@/features/cart/types';

import { useInvoicePanelPaymentBootstrap } from './useInvoicePanelPaymentBootstrap';

const createPaymentMethods = (
  overrides: Partial<PaymentMethod>[] = [],
): PaymentMethod[] => [
  {
    method: 'cash',
    status: false,
    value: 0,
    ...overrides[0],
  },
  {
    method: 'card',
    status: false,
    value: 0,
    ...overrides[1],
  },
  {
    method: 'transfer',
    status: false,
    value: 0,
    ...overrides[2],
  },
];

const createCart = (totalPurchase = 500): CartData =>
  ({
    totalPurchase: { value: totalPurchase },
  }) as CartData;

const createProps = ({
  cart = createCart(),
  dispatch = vi.fn(),
  invoicePanel = true,
  isAddedToReceivables = false,
  paymentMethods = createPaymentMethods(),
}: {
  cart?: CartData;
  dispatch?: (action: unknown) => void;
  invoicePanel?: boolean;
  isAddedToReceivables?: boolean;
  paymentMethods?: PaymentMethod[];
} = {}) => ({
  cart,
  dispatch,
  invoicePanel,
  isAddedToReceivables,
  paymentMethods,
});

describe('useInvoicePanelPaymentBootstrap', () => {
  it('bootstraps payment methods when the invoice panel opens', () => {
    const dispatch = vi.fn();

    renderHook((props) => useInvoicePanelPaymentBootstrap(props), {
      initialProps: createProps({
        cart: createCart(1250),
        dispatch,
        invoicePanel: true,
        paymentMethods: createPaymentMethods(),
      }),
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      setPaymentMethod({
        method: 'cash',
        status: true,
        value: 1250,
      }),
    );
  });

  it('does not re-bootstrap while the panel remains open', () => {
    const dispatch = vi.fn();

    const { rerender } = renderHook(
      (props) => useInvoicePanelPaymentBootstrap(props),
      {
        initialProps: createProps({
          cart: createCart(500),
          dispatch,
          invoicePanel: true,
          paymentMethods: createPaymentMethods(),
        }),
      },
    );

    rerender(
      createProps({
        cart: createCart(750),
        dispatch,
        invoicePanel: true,
        paymentMethods: createPaymentMethods(),
      }),
    );

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenLastCalledWith(
      setPaymentMethod({
        method: 'cash',
        status: true,
        value: 500,
      }),
    );
  });

  it('resets bootstrap state when the panel closes and reopens', () => {
    const dispatch = vi.fn();

    const { rerender } = renderHook(
      (props) => useInvoicePanelPaymentBootstrap(props),
      {
        initialProps: createProps({
          cart: createCart(500),
          dispatch,
          invoicePanel: true,
          paymentMethods: createPaymentMethods(),
        }),
      },
    );

    rerender(
      createProps({
        cart: createCart(500),
        dispatch,
        invoicePanel: false,
        paymentMethods: createPaymentMethods(),
      }),
    );
    rerender(
      createProps({
        cart: createCart(300),
        dispatch,
        invoicePanel: true,
        paymentMethods: createPaymentMethods(),
      }),
    );

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenLastCalledWith(
      setPaymentMethod({
        method: 'cash',
        status: true,
        value: 300,
      }),
    );
  });

  it('bootstraps cash with zero when receivables is enabled in-panel with all methods disabled', () => {
    const dispatch = vi.fn();
    const initialMethods = createPaymentMethods([
      { status: false, value: 0 },
      { status: true, value: 25 },
    ]);
    const disabledMethods = createPaymentMethods();

    const { rerender } = renderHook(
      (props) => useInvoicePanelPaymentBootstrap(props),
      {
        initialProps: createProps({
          cart: createCart(500),
          dispatch,
          invoicePanel: true,
          paymentMethods: initialMethods,
        }),
      },
    );

    rerender(
      createProps({
        cart: createCart(500),
        dispatch,
        invoicePanel: true,
        paymentMethods: disabledMethods,
      }),
    );
    rerender(
      createProps({
        cart: createCart(500),
        dispatch,
        invoicePanel: true,
        isAddedToReceivables: true,
        paymentMethods: disabledMethods,
      }),
    );

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      setPaymentMethod({
        method: 'cash',
        status: true,
        value: 0,
      }),
    );
  });

  it('does not overwrite a partial payment when receivables is enabled in-panel', () => {
    const dispatch = vi.fn();
    const partialPaymentMethods = createPaymentMethods([
      { status: true, value: 125 },
    ]);

    const { rerender } = renderHook(
      (props) => useInvoicePanelPaymentBootstrap(props),
      {
        initialProps: createProps({
          cart: createCart(500),
          dispatch,
          invoicePanel: true,
          paymentMethods: partialPaymentMethods,
        }),
      },
    );

    rerender(
      createProps({
        cart: createCart(500),
        dispatch,
        invoicePanel: true,
        isAddedToReceivables: true,
        paymentMethods: partialPaymentMethods,
      }),
    );

    expect(dispatch).not.toHaveBeenCalled();
  });
});
