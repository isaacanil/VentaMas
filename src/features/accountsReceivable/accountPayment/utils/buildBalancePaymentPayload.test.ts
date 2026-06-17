import { describe, expect, it } from 'vitest';

import { buildBalancePaymentPayload } from './buildBalancePaymentPayload';

describe('buildBalancePaymentPayload', () => {
  it('builds the balance payment payload with client details', () => {
    expect(
      buildBalancePaymentPayload({
        client: {
          id: 'client-123',
          name: 'Cliente Demo',
          numberId: 'C-001',
        },
        pendingBalance: 450,
      }),
    ).toEqual({
      isOpen: true,
      paymentDetails: {
        paymentScope: 'balance',
        totalAmount: 450,
        clientId: 'client-123',
      },
      extra: {
        clientName: 'Cliente Demo',
        clientCode: 'C-001',
      },
    });
  });

  it('uses the client id as clientCode when numberId is missing', () => {
    const payload = buildBalancePaymentPayload({
      client: {
        id: 'client-456',
        name: 'Cliente sin codigo',
      },
      pendingBalance: 125,
    });

    expect(payload.extra).toMatchObject({
      clientName: 'Cliente sin codigo',
      clientCode: 'client-456',
    });
  });
});
