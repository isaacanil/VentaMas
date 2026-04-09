import {
  buildOrderStatusPatch,
  normalizeOrderRecord,
  resolveLegacyOrderState,
  resolveOrderStatus,
} from './status';

describe('order status helpers', () => {
  it('normalizes legacy nested order documents', () => {
    const order = normalizeOrderRecord({
      data: {
        id: 'order-1',
        numberId: 12,
        provider: 'provider-1',
        state: 'state_2',
      },
    });

    expect(order.id).toBe('order-1');
    expect(order.status).toBe('pending');
    expect(order.state).toBe('state_2');
  });

  it('maps top-level completed status to legacy state', () => {
    expect(resolveLegacyOrderState('completed')).toBe('state_3');
    expect(resolveOrderStatus({ status: 'completed' })).toBe('completed');
  });

  it('builds nested patch only when order uses legacy data wrapper', () => {
    expect(
      buildOrderStatusPatch({ data: { state: 'state_2' } }, 'canceled'),
    ).toMatchObject({
      status: 'canceled',
      state: 'state_4',
      'data.state': 'state_4',
    });

    expect(buildOrderStatusPatch({ status: 'pending' }, 'pending')).toEqual({
      status: 'pending',
      state: 'state_2',
    });
  });
});
