import { beforeEach, describe, expect, it, vi } from 'vitest';

let docMock = vi.fn();
const serverTimestampMock = vi.fn(() => ({ __op: 'serverTimestamp' }));

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => docMock(...args),
  },
  FieldValue: {
    serverTimestamp: (...args) => serverTimestampMock(...args),
  },
}));

import {
  getIdempotency,
  getIdempotencyRef,
  upsertIdempotency,
} from './idempotency.service.js';

describe('idempotency.service', () => {
  const refs = new Map();

  const getRef = (path) => {
    if (!refs.has(path)) {
      refs.set(path, {
        path,
        get: vi.fn(),
        set: vi.fn(),
      });
    }
    return refs.get(path);
  };

  beforeEach(() => {
    refs.clear();
    docMock = vi.fn((path) => getRef(path));
    serverTimestampMock.mockClear();
  });

  it('devuelve null cuando la clave de idempotencia no existe', async () => {
    const ref = getRef('businesses/business-1/idempotency/idem-1');
    ref.get.mockResolvedValue({
      exists: false,
    });

    await expect(getIdempotency('business-1', 'idem-1')).resolves.toBeNull();
  });

  it('devuelve el id y los datos cuando el documento existe', async () => {
    const ref = getRef('businesses/business-1/idempotency/idem-2');
    ref.get.mockResolvedValue({
      exists: true,
      id: 'idem-2',
      data: () => ({
        invoiceId: 'invoice-2',
        status: 'pending',
      }),
    });

    await expect(getIdempotency('business-1', 'idem-2')).resolves.toEqual({
      id: 'idem-2',
      invoiceId: 'invoice-2',
      status: 'pending',
    });
  });

  it('hace upsert con merge y timestamps del servidor', async () => {
    const ref = getRef('businesses/business-1/idempotency/idem-3');

    await expect(
      upsertIdempotency({
        businessId: 'business-1',
        key: 'idem-3',
        invoiceId: 'invoice-3',
        payloadHash: 'hash-3',
      }),
    ).resolves.toEqual({
      key: 'idem-3',
      invoiceId: 'invoice-3',
      status: 'pending',
    });

    expect(ref.set).toHaveBeenCalledWith(
      {
        key: 'idem-3',
        invoiceId: 'invoice-3',
        payloadHash: 'hash-3',
        status: 'pending',
        updatedAt: { __op: 'serverTimestamp' },
        createdAt: { __op: 'serverTimestamp' },
      },
      { merge: true },
    );
  });

  it('expone la referencia del documento para reuse en transacciones', () => {
    const ref = getIdempotencyRef('business-1', 'idem-4');

    expect(docMock).toHaveBeenCalledWith(
      'businesses/business-1/idempotency/idem-4',
    );
    expect(ref).toBe(getRef('businesses/business-1/idempotency/idem-4'));
  });
});
