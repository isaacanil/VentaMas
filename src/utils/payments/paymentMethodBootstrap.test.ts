import { describe, expect, it } from 'vitest';

import {
  resolvePaymentMethodBootstrapUpdate,
  resolvePaymentMethodStatusValue,
  type PaymentMethodBootstrapItem,
} from './paymentMethodBootstrap';

const createMethods = (
  overrides: Partial<PaymentMethodBootstrapItem>[] = [],
): PaymentMethodBootstrapItem[] => [
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

describe('paymentMethodBootstrap', () => {
  describe('resolvePaymentMethodBootstrapUpdate', () => {
    it('activates cash with the purchase total when no method is enabled', () => {
      const methods = createMethods();

      expect(
        resolvePaymentMethodBootstrapUpdate({
          isAddedToReceivables: false,
          paymentMethods: methods,
          purchaseTotal: 1250,
        }),
      ).toEqual({
        method: 'cash',
        status: true,
        value: 1250,
      });
    });

    it('activates cash with zero when the sale is added to receivables', () => {
      const methods = createMethods();

      expect(
        resolvePaymentMethodBootstrapUpdate({
          isAddedToReceivables: true,
          paymentMethods: methods,
          purchaseTotal: 1250,
        }),
      ).toEqual({
        method: 'cash',
        status: true,
        value: 0,
      });
    });

    it('falls back to the first method when cash is unavailable', () => {
      const methods = createMethods([
        { method: 'card' },
        { method: 'transfer' },
      ]).slice(0, 2);

      expect(
        resolvePaymentMethodBootstrapUpdate({
          isAddedToReceivables: false,
          paymentMethods: methods,
          purchaseTotal: 500,
        }),
      ).toEqual({
        method: 'card',
        status: true,
        value: 500,
      });
    });

    it('does not update when an enabled method already has an amount', () => {
      const methods = createMethods([{ status: true, value: 100 }]);

      expect(
        resolvePaymentMethodBootstrapUpdate({
          isAddedToReceivables: false,
          paymentMethods: methods,
          purchaseTotal: 500,
        }),
      ).toBeNull();
    });

    it('fills cash with the purchase total when active direct-sale methods total zero', () => {
      const methods = createMethods([{ status: true, value: 0 }]);

      expect(
        resolvePaymentMethodBootstrapUpdate({
          isAddedToReceivables: false,
          paymentMethods: methods,
          purchaseTotal: 500,
        }),
      ).toEqual({
        method: 'cash',
        status: true,
        value: 500,
      });
    });

    it('does not fill active zero-value methods for receivable sales', () => {
      const methods = createMethods([{ status: true, value: 0 }]);

      expect(
        resolvePaymentMethodBootstrapUpdate({
          isAddedToReceivables: true,
          paymentMethods: methods,
          purchaseTotal: 500,
        }),
      ).toBeNull();
    });

    it('does not fill active zero-value methods when cash is unavailable', () => {
      const methods = createMethods([
        { method: 'card', status: true, value: 0 },
        { method: 'transfer' },
      ]).slice(0, 2);

      expect(
        resolvePaymentMethodBootstrapUpdate({
          isAddedToReceivables: false,
          paymentMethods: methods,
          purchaseTotal: 500,
        }),
      ).toBeNull();
    });
  });

  describe('resolvePaymentMethodStatusValue', () => {
    it('uses the remaining purchase total when activating a method', () => {
      const methods = createMethods([
        { status: true, value: 300 },
        { status: false, value: 0 },
        { status: true, value: 125 },
      ]);

      expect(
        resolvePaymentMethodStatusValue({
          method: methods[1],
          paymentMethods: methods,
          status: true,
          totalPurchase: 500,
        }),
      ).toBe(75);
    });

    it('returns zero when active methods already cover the purchase total', () => {
      const methods = createMethods([
        { status: true, value: 300 },
        { status: false, value: 0 },
        { status: true, value: 250 },
      ]);

      expect(
        resolvePaymentMethodStatusValue({
          method: methods[1],
          paymentMethods: methods,
          status: true,
          totalPurchase: 500,
        }),
      ).toBe(0);
    });

    it('returns zero when deactivating a method', () => {
      const methods = createMethods([{ status: true, value: 300 }]);

      expect(
        resolvePaymentMethodStatusValue({
          method: methods[0],
          paymentMethods: methods,
          status: false,
          totalPurchase: 500,
        }),
      ).toBe(0);
    });

    it('ignores inactive methods and non-numeric active values', () => {
      const methods = createMethods([
        { status: true, value: 'abc' },
        { status: false, value: 200 },
        { status: false, value: 0 },
      ]);

      expect(
        resolvePaymentMethodStatusValue({
          method: methods[2],
          paymentMethods: methods,
          status: true,
          totalPurchase: 500,
        }),
      ).toBe(500);
    });
  });
});
