import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let docMock = vi.fn();

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => docMock(...args),
  },
}));

import { getProductStockById } from './productStock.service.js';

describe('productStock.service', () => {
  const refs = new Map();
  let consoleErrorSpy;

  const getRef = (path) => {
    if (!refs.has(path)) {
      refs.set(path, {
        path,
        get: vi.fn(),
      });
    }
    return refs.get(path);
  };

  beforeEach(() => {
    refs.clear();
    docMock = vi.fn((path) => getRef(path));
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('valida que exista businessID antes de consultar Firestore', async () => {
    await expect(getProductStockById({}, 'stock-1')).rejects.toThrow(
      'getProductStockById: se requiere user.businessID válido',
    );
  });

  it('devuelve null cuando no se envia productStockId', async () => {
    await expect(
      getProductStockById({ businessID: 'business-1' }, null),
    ).resolves.toBeNull();

    expect(docMock).not.toHaveBeenCalled();
  });

  it('rechaza ids que no sean string', async () => {
    await expect(
      getProductStockById({ businessID: 'business-1' }, 123),
    ).rejects.toThrow('getProductStockById: productStockId debe ser un string');
  });

  it('devuelve null cuando el documento no existe', async () => {
    const ref = getRef('businesses/business-1/productsStock/stock-1');
    ref.get.mockResolvedValue({
      exists: false,
    });

    await expect(
      getProductStockById({ businessID: 'business-1' }, 'stock-1'),
    ).resolves.toBeNull();
  });

  it('devuelve los datos del stock cuando el documento existe', async () => {
    const ref = getRef('businesses/business-1/productsStock/stock-2');
    ref.get.mockResolvedValue({
      exists: true,
      data: () => ({
        quantity: 8,
        batchId: 'batch-2',
      }),
    });

    await expect(
      getProductStockById({ businessID: 'business-1' }, 'stock-2'),
    ).resolves.toEqual({
      quantity: 8,
      batchId: 'batch-2',
    });
  });

  it('envuelve errores de Firestore con contexto util', async () => {
    const ref = getRef('businesses/business-1/productsStock/stock-3');
    ref.get.mockRejectedValue(new Error('permission-denied'));

    await expect(
      getProductStockById({ businessID: 'business-1' }, 'stock-3'),
    ).rejects.toThrow(
      'No se pudo leer productsStock/stock-3: permission-denied',
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'getProductStockById error:',
      expect.objectContaining({
        businessID: 'business-1',
        productStockId: 'stock-3',
        message: 'permission-denied',
      }),
    );
  });
});
