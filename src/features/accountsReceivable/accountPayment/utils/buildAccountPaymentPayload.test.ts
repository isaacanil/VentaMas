import { describe, expect, it } from 'vitest';

import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

import { buildAccountPaymentPayload } from './buildAccountPaymentPayload';

describe('buildAccountPaymentPayload', () => {
  it('builds the account payment payload with client and account details', () => {
    const account: AccountsReceivableDoc = {
      id: 'ar-123',
      numberId: 'AR-001',
      installmentAmount: 250,
    };

    expect(
      buildAccountPaymentPayload({
        client: {
          id: 'client-123',
          name: 'Cliente Demo',
          numberId: 'C-001',
        },
        account,
        balance: 900,
      }),
    ).toEqual({
      isOpen: true,
      paymentDetails: {
        clientId: 'client-123',
        arId: 'ar-123',
        paymentScope: 'account',
        totalAmount: 900,
      },
      extra: {
        ...account,
        clientName: 'Cliente Demo',
        clientCode: 'C-001',
      },
    });
  });

  it('uses the client id as clientCode when numberId is missing', () => {
    const payload = buildAccountPaymentPayload({
      client: {
        id: 'client-456',
        name: 'Cliente sin codigo',
      },
      account: {
        id: 'ar-456',
      },
      balance: 125,
    });

    expect(payload.extra).toMatchObject({
      clientName: 'Cliente sin codigo',
      clientCode: 'client-456',
    });
  });
});
