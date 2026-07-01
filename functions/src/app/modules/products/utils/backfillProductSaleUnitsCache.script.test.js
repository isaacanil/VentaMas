import { describe, expect, it, vi } from 'vitest';

const serverTimestampMock = vi.fn(() => 'server-timestamp');

vi.mock('firebase-admin', () => ({
  default: {
    firestore: {
      FieldValue: {
        serverTimestamp: (...args) => serverTimestampMock(...args),
      },
    },
  },
}));

import {
  backfillProductSaleUnitsCache,
  parseBackfillProductSaleUnitsCacheOptions,
} from '../../../../../scripts/backfillProductSaleUnitsCache.js';

const docSnap = ({ id, data, saleUnits = [] }) => {
  const update = vi.fn();
  const ref = {
    update,
    collection: vi.fn(() => ({
      get: vi.fn(async () => ({
        docs: saleUnits.map((saleUnit) => ({
          id: saleUnit.id,
          data: () => saleUnit,
        })),
      })),
    })),
  };

  return {
    id,
    ref,
    exists: true,
    data: () => data,
    update,
  };
};

const dbWithProducts = (products) => ({
  collection: vi.fn(() => ({
    get: vi.fn(async () => ({ docs: products })),
    limit: vi.fn(() => ({
      get: vi.fn(async () => ({ docs: products })),
    })),
  })),
  doc: vi.fn(),
});

describe('backfillProductSaleUnitsCache script', () => {
  it('plans saleUnits cache updates in dry-run without writing product docs', async () => {
    const product = docSnap({
      id: 'product-1',
      data: { id: 'product-1', saleUnits: [] },
      saleUnits: [{ id: 'box-12', unitName: 'Caja', quantity: 12 }],
    });
    const db = dbWithProducts([product]);

    const summary = await backfillProductSaleUnitsCache(db, {
      businessId: 'business-1',
      dryRun: true,
    });

    expect(summary).toMatchObject({
      mode: 'dry-run',
      businessId: 'business-1',
      scanned: 1,
      plannedUpdates: 1,
      writtenUpdates: 0,
      countRepairs: 0,
      updatedProducts: [
        {
          productId: 'product-1',
          reason: 'backfill_from_subcollection',
          saleUnitsCount: 1,
          subcollectionCount: 1,
        },
      ],
    });
    expect(product.ref.update).not.toHaveBeenCalled();
  });

  it('writes only the planned cache patch when write mode is explicit', async () => {
    const product = docSnap({
      id: 'product-1',
      data: { id: 'product-1', saleUnits: [] },
      saleUnits: [
        {
          id: 'box-12',
          unitName: 'Caja',
          quantity: 12,
          pricing: { price: '480' },
        },
      ],
    });
    const db = dbWithProducts([product]);

    const summary = await backfillProductSaleUnitsCache(db, {
      businessId: 'business-1',
      dryRun: false,
    });

    expect(summary).toMatchObject({
      mode: 'write',
      scanned: 1,
      plannedUpdates: 1,
      writtenUpdates: 1,
    });
    expect(product.ref.update).toHaveBeenCalledWith({
      saleUnits: [
        expect.objectContaining({
          id: 'box-12',
          unitName: 'Caja',
          quantity: 12,
          conversionFactorToBase: 12,
          pricing: expect.objectContaining({ price: 480 }),
        }),
      ],
      saleUnitsCount: 1,
      updatedAt: 'server-timestamp',
    });
  });

  it('blocks write mode before partial updates when the scan finds invalid units', async () => {
    const validProduct = docSnap({
      id: 'product-1',
      data: { id: 'product-1', saleUnits: [] },
      saleUnits: [{ id: 'box-12', unitName: 'Caja', quantity: 12 }],
    });
    const invalidProduct = docSnap({
      id: 'product-2',
      data: { id: 'product-2', saleUnits: [] },
      saleUnits: [{ id: 'broken-unit', unitName: 'Rota', quantity: 0 }],
    });
    const db = dbWithProducts([validProduct, invalidProduct]);

    await expect(
      backfillProductSaleUnitsCache(db, {
        businessId: 'business-1',
        dryRun: false,
      }),
    ).rejects.toThrow('Backfill detenido');

    expect(validProduct.ref.update).not.toHaveBeenCalled();
    expect(invalidProduct.ref.update).not.toHaveBeenCalled();
  });

  it('uses productId lookup without scanning the whole product collection', async () => {
    const product = docSnap({
      id: 'product-1',
      data: {
        id: 'product-1',
        saleUnits: [{ id: 'box-12', quantity: 12 }],
        saleUnitsCount: 1,
      },
      saleUnits: [{ id: 'box-12', quantity: 12 }],
    });
    const db = {
      collection: vi.fn(),
      doc: vi.fn(() => ({
        get: vi.fn(async () => product),
      })),
    };

    const summary = await backfillProductSaleUnitsCache(db, {
      businessId: 'business-1',
      productId: 'product-1',
      dryRun: true,
    });

    expect(db.doc).toHaveBeenCalledWith(
      'businesses/business-1/products/product-1',
    );
    expect(db.collection).not.toHaveBeenCalled();
    expect(summary).toMatchObject({
      scanned: 1,
      plannedUpdates: 0,
      skipped: {
        embedded_sale_units_present: 1,
      },
    });
  });

  it('rejects invalid limit arguments before Firestore initialization', () => {
    expect(() =>
      parseBackfillProductSaleUnitsCacheOptions([
        '--businessId',
        'business-1',
        '--limit',
        'nope',
      ]),
    ).toThrow('--limit debe ser un entero positivo.');

    expect(() =>
      parseBackfillProductSaleUnitsCacheOptions([
        '--businessId',
        'business-1',
        '--limit=0',
      ]),
    ).toThrow('--limit debe ser un entero positivo.');
  });
});
