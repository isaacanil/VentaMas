import { describe, expect, it } from 'vitest';

import { buildInvoiceSubmissionIdempotencyKey } from './invoiceSubmissionIdempotency';

const baseInput = () => ({
  accountsReceivable: null,
  businessId: 'business-1',
  cart: {
    id: 'cart-1',
    paymentMethod: [{ method: 'cash', status: true, value: 118 }],
    products: [{ id: 'product-1', amountToBuy: 1, price: 100 }],
    totalPurchase: { value: 118 },
  },
  client: { id: 'client-1' },
  dueDate: null,
  hasDueDate: false,
  insuranceAR: null,
  insuranceAuth: null,
  insuranceEnabled: false,
  invoiceComment: null,
  isTestMode: false,
  monetaryContext: null,
  ncfType: 'E32',
  seed: 'gen:seed-1',
  serviceCommissions: null,
  taxReceiptEnabled: true,
  userId: 'user-1',
});

describe('buildInvoiceSubmissionIdempotencyKey', () => {
  it('mantiene la misma llave para el mismo snapshot de venta', () => {
    const first = buildInvoiceSubmissionIdempotencyKey(baseInput());
    const second = buildInvoiceSubmissionIdempotencyKey({
      ...baseInput(),
      cart: {
        totalPurchase: { value: 118 },
        products: [{ price: 100, amountToBuy: 1, id: 'product-1' }],
        paymentMethod: [{ value: 118, status: true, method: 'cash' }],
        id: 'cart-1',
      },
    });

    expect(second).toBe(first);
  });

  it('cambia la llave cuando cambia el contenido que viaja al backend', () => {
    const first = buildInvoiceSubmissionIdempotencyKey(baseInput());
    const second = buildInvoiceSubmissionIdempotencyKey({
      ...baseInput(),
      cart: {
        ...baseInput().cart,
        paymentMethod: [{ method: 'cash', status: true, value: 236 }],
        totalPurchase: { value: 236 },
      },
    });

    expect(second).not.toBe(first);
  });

  it('produce una llave segura para usar como documento de idempotencia', () => {
    const key = buildInvoiceSubmissionIdempotencyKey({
      ...baseInput(),
      seed: 'gen:seed/with spaces',
    });

    expect(key).toMatch(/^sale:[a-z0-9]+:gen:seed_with_spaces$/);
    expect(key).not.toContain('/');
  });
});
