import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let docMock = vi.fn();
let runTransactionMock = vi.fn();
const serverTimestampMock = vi.fn(() => ({ __op: 'serverTimestamp' }));
const timestampNowMock = vi.fn(() => ({ __op: 'timestampNow' }));
const stableHashMock = vi.fn();
const assertUsageCanIncreaseMock = vi.fn();
const resolvePilotMonetarySnapshotForBusinessMock = vi.fn();
const isAccountingRolloutEnabledForBusinessMock = vi.fn();
const auditTxMock = vi.fn();
const getIdempotencyRefMock = vi.fn();
const reserveNcfMock = vi.fn();
const nanoidMock = vi.fn();

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => docMock(...args),
    runTransaction: (...args) => runTransactionMock(...args),
  },
  FieldValue: {
    serverTimestamp: (...args) => serverTimestampMock(...args),
  },
  Timestamp: {
    now: (...args) => timestampNowMock(...args),
  },
}));

vi.mock('../utils/hash.util.js', () => ({
  stableHash: (...args) => stableHashMock(...args),
}));

vi.mock('../../billing/services/usage.service.js', () => ({
  assertUsageCanIncrease: (...args) => assertUsageCanIncreaseMock(...args),
}));

vi.mock('../../accounting/utils/accountingRollout.util.js', () => ({
  resolvePilotMonetarySnapshotForBusiness: (...args) =>
    resolvePilotMonetarySnapshotForBusinessMock(...args),
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

vi.mock('./audit.service.js', () => ({
  auditTx: (...args) => auditTxMock(...args),
}));

vi.mock('./idempotency.service.js', () => ({
  getIdempotencyRef: (...args) => getIdempotencyRefMock(...args),
}));

vi.mock('./ncf.service.js', () => ({
  reserveNcf: (...args) => reserveNcfMock(...args),
}));

vi.mock('nanoid', () => ({
  nanoid: (...args) => nanoidMock(...args),
}));

import {
  buildTrustedAccountsReceivableFromInvoicePayload,
  createPendingInvoice,
} from './orchestrator.service.js';

describe('orchestrator.service', () => {
  let tx;
  let refs;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-17T00:00:00.000Z'));

    stableHashMock.mockReset();
    assertUsageCanIncreaseMock.mockReset();
    resolvePilotMonetarySnapshotForBusinessMock.mockReset();
    isAccountingRolloutEnabledForBusinessMock.mockReset();
    auditTxMock.mockReset();
    getIdempotencyRefMock.mockReset();
    reserveNcfMock.mockReset();
    nanoidMock.mockReset();

    stableHashMock
      .mockReturnValueOnce('payload-hash')
      .mockReturnValueOnce('cart-hash');
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(false);
    nanoidMock
      .mockReturnValueOnce('task-inventory')
      .mockReturnValueOnce('task-canonical')
      .mockReturnValueOnce('task-cash-count');

    refs = new Map();
    const getRef = (path) => {
      if (!refs.has(path)) {
        refs.set(path, { path });
      }
      return refs.get(path);
    };

    docMock = vi.fn((path) => getRef(path));
    getIdempotencyRefMock.mockImplementation((businessId, idempotencyKey) =>
      getRef(`idempotency:${businessId}:${idempotencyKey}`),
    );

    tx = {
      get: vi.fn(async (ref) => {
        if (ref.path === 'idempotency:business-1:idem-1') {
          return { exists: false };
        }
        if (ref.path === 'businesses/business-1') {
          return {
            exists: true,
            data: () => ({
              subscription: {
                status: 'active',
                planId: 'plus',
                limits: { monthlyInvoices: 10 },
              },
            }),
          };
        }
        if (ref.path === 'businesses/business-1/usage/current') {
          return { exists: true, data: () => ({ monthlyInvoices: 2 }) };
        }
        if (
          ref.path.startsWith('businesses/business-1/usage/monthly/entries/')
        ) {
          return { exists: true, data: () => ({ monthlyInvoices: 3 }) };
        }
        if (ref.path === 'businesses/business-1/settings/accounting') {
          return { exists: false, data: () => ({}) };
        }
        if (ref.path === 'businesses/business-1/settings/taxReceipt') {
          return { exists: true, data: () => ({ taxReceiptEnabled: false }) };
        }
        if (
          ref.path.startsWith('businesses/business-1/accountingPeriodClosures/')
        ) {
          return { exists: false, data: () => ({}) };
        }
        if (ref.path === 'platformConfig/gisysFact') {
          return { exists: false, data: () => ({}) };
        }
        throw new Error(`Unexpected tx.get path: ${ref.path}`);
      }),
      set: vi.fn(),
    };

    runTransactionMock = vi.fn(async (callback) => callback(tx));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('recalcula la CxC desde la factura y no desde totalReceivable del cliente', async () => {
    const trustedAr = buildTrustedAccountsReceivableFromInvoicePayload({
      invoiceId: 'invoice-1',
      nowMs: 1773705600000,
      payload: {
        client: { id: 'client-1' },
        cart: {
          totalPurchase: { value: 236 },
          payment: { value: 60 },
          paymentMethod: [
            { method: 'cash', status: true, value: 40 },
            { method: 'creditNote', status: true, value: 20 },
          ],
          creditNotePayment: [{ id: 'credit-note-1', amountUsed: 20 }],
        },
        accountsReceivable: {
          clientId: 'client-spoof',
          totalReceivable: 1,
          currentBalance: 1,
          totalInstallments: 4,
          paymentFrequency: 'monthly',
        },
      },
    });

    expect(trustedAr).toEqual(
      expect.objectContaining({
        invoiceId: 'invoice-1',
        clientId: 'client-1',
        totalReceivable: 176,
        currentBalance: 176,
        remainingBalance: 176,
        arBalance: 176,
        installmentAmount: 44,
        totalInstallments: 4,
        paymentFrequency: 'monthly',
        createdAt: 1773705600000,
        updatedAt: 1773705600000,
      }),
    );
  });

  it('rechaza ventas marcadas como CxC sin balance pendiente', () => {
    expect(() =>
      buildTrustedAccountsReceivableFromInvoicePayload({
        invoiceId: 'invoice-1',
        nowMs: 1773705600000,
        payload: {
          cart: {
            totalPurchase: { value: 236 },
            payment: { value: 236 },
            paymentMethod: [{ method: 'cash', status: true, value: 236 }],
          },
          accountsReceivable: {
            totalReceivable: 236,
            totalInstallments: 2,
          },
        },
      }),
    ).toThrow('La venta a credito no tiene balance pendiente por cobrar.');
  });

  it('returns the existing invoice when the idempotency key was already registered', async () => {
    tx.get.mockImplementation(async (ref) => {
      if (ref.path === 'idempotency:business-1:idem-1') {
        return {
          exists: true,
          data: () => ({
            invoiceId: 'invoice-existing',
          }),
        };
      }
      if (ref.path === 'platformConfig/gisysFact') {
        return { exists: false, data: () => ({}) };
      }
      throw new Error(`Unexpected tx.get path: ${ref.path}`);
    });

    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        payload: { cart: {} },
        idempotencyKey: 'idem-1',
      }),
    ).resolves.toEqual({
      invoiceId: 'invoice-existing',
      status: 'pending',
      alreadyExists: true,
    });

    expect(tx.set).not.toHaveBeenCalled();
  });

  it('rejects reused idempotency keys with a different payload hash', async () => {
    tx.get.mockImplementation(async (ref) => {
      if (ref.path === 'idempotency:business-1:idem-1') {
        return {
          exists: true,
          data: () => ({
            invoiceId: 'invoice-existing',
            payloadHash: 'other-payload-hash',
          }),
        };
      }
      if (ref.path === 'platformConfig/gisysFact') {
        return { exists: false, data: () => ({}) };
      }
      throw new Error(`Unexpected tx.get path: ${ref.path}`);
    });

    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        payload: { cart: {} },
        idempotencyKey: 'idem-1',
      }),
    ).rejects.toMatchObject({
      code: 'already-exists',
      message: 'La llave de idempotencia ya fue utilizada con otro payload.',
    });

    expect(tx.set).not.toHaveBeenCalled();
  });

  it('creates a pending invoice with derived due date, comment and usage updates', async () => {
    const result = await createPendingInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      idempotencyKey: 'idem-1',
      cashCountId: 'cash-1',
      payload: {
        cart: {
          id: 'cart-1',
          hasDueDate: true,
          billing: {
            hasDueDate: true,
            duePeriod: {
              days: 10,
            },
          },
          products: [
            {
              id: 'p1',
              name: 'Producto A',
              amountToBuy: 1,
              baseQuantity: 12,
              selectedSaleUnit: {
                id: 'box-12',
                unitName: 'Caja',
                quantity: 12,
                conversionFactorToBase: 12,
              },
              trackInventory: false,
              productStockId: 'stock-1',
              batchId: 'batch-1',
              comment: 'observacion',
            },
          ],
          payment: { value: 250 },
          totalPurchaseWithoutTaxes: { value: 200 },
          totalTaxes: { value: 36 },
          totalPurchase: { value: 236 },
        },
        client: { id: 'client-1' },
      },
    });

    expect(assertUsageCanIncreaseMock).toHaveBeenCalledWith({
      subscription: expect.objectContaining({
        planId: 'plus',
      }),
      metricKey: 'monthlyInvoices',
      currentValue: 3,
      incrementBy: 1,
      planId: 'plus',
    });
    expect(result).toEqual({
      invoiceId: 'cart-1',
      status: 'pending',
      alreadyExists: false,
    });

    const invoiceWrite = tx.set.mock.calls.find(
      ([ref]) => ref.path === 'businesses/business-1/invoicesV2/cart-1',
    );
    expect(invoiceWrite).toBeTruthy();
    expect(invoiceWrite[1]).toEqual(
      expect.objectContaining({
        version: 2,
        status: 'pending',
        businessId: 'business-1',
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        requestHash: 'payload-hash',
        cartHash: 'cart-hash',
        snapshot: expect.objectContaining({
          dueDate: new Date('2026-03-27T00:00:00.000Z').getTime(),
          invoiceComment: 'Producto A: observacion',
          meta: expect.objectContaining({
            cashCount: {
              intendedCashCountId: 'cash-1',
            },
          }),
        }),
      }),
    );

    const idempotencyWrite = tx.set.mock.calls.find(
      ([ref]) => ref.path === 'idempotency:business-1:idem-1',
    );
    expect(idempotencyWrite[1]).toEqual(
      expect.objectContaining({
        invoiceId: 'cart-1',
        payloadHash: 'payload-hash',
        status: 'pending',
      }),
    );

    const inventoryTaskWrite = tx.set.mock.calls.find(
      ([ref]) =>
        ref.path ===
        'businesses/business-1/invoicesV2/cart-1/outbox/task-inventory',
    );
    expect(inventoryTaskWrite?.[1]).toMatchObject({
      type: 'updateInventory',
      payload: {
        businessId: 'business-1',
        userId: 'user-1',
        products: [
          expect.objectContaining({
            id: 'p1',
            trackInventory: true,
            productStockId: 'stock-1',
            batchId: 'batch-1',
            amountToBuy: 1,
            baseQuantity: 12,
            selectedSaleUnit: expect.objectContaining({
              id: 'box-12',
              unitName: 'Caja',
              quantity: 12,
              conversionFactorToBase: 12,
              allowFractional: false,
            }),
          }),
        ],
      },
    });
  });

  it('freezes combo recipe snapshots in the inventory outbox task', async () => {
    await createPendingInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      idempotencyKey: 'idem-1',
      payload: {
        cart: {
          id: 'cart-combo',
          products: [
            {
              id: 'combo-1',
              name: 'Combo desayuno',
              itemType: 'combo',
              amountToBuy: 2,
              combo: {
                inventoryPolicy: 'components',
                components: [
                  {
                    id: 'coffee-line',
                    productId: 'coffee',
                    productName: 'Cafe',
                    quantity: 2,
                  },
                ],
              },
            },
          ],
          payment: { value: 500 },
          totalPurchaseWithoutTaxes: { value: 500 },
          totalTaxes: { value: 0 },
          totalPurchase: { value: 500 },
        },
        client: { id: 'client-1' },
      },
    });

    const inventoryTaskWrite = tx.set.mock.calls.find(
      ([ref]) =>
        ref.path ===
        'businesses/business-1/invoicesV2/cart-combo/outbox/task-inventory',
    );
    expect(inventoryTaskWrite?.[1]).toMatchObject({
      type: 'updateInventory',
      payload: {
        products: [
          expect.objectContaining({
            id: 'combo-1',
            name: 'Combo desayuno',
            itemType: 'combo',
            amountToBuy: 2,
            combo: expect.objectContaining({
              enabled: true,
              inventoryPolicy: 'components',
              components: [
                expect.objectContaining({
                  id: 'coffee-line',
                  productId: 'coffee',
                  productName: 'Cafe',
                  quantity: 2,
                }),
              ],
            }),
          }),
        ],
      },
    });
  });

  it('cleans service inventory fields in the inventory outbox task', async () => {
    await createPendingInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      idempotencyKey: 'idem-1',
      payload: {
        cart: {
          id: 'cart-service',
          products: [
            {
              id: 'service-1',
              name: 'Instalacion',
              itemType: 'service',
              amountToBuy: 1,
              trackInventory: true,
              productStockId: 'stock-1',
              batchId: 'batch-1',
              selectedSaleUnit: {
                id: 'box-12',
                quantity: 12,
                conversionFactorToBase: 12,
              },
              weightDetail: {
                isSoldByWeight: true,
                weight: 2,
                weightUnit: 'lb',
              },
            },
          ],
          payment: { value: 500 },
          totalPurchaseWithoutTaxes: { value: 500 },
          totalTaxes: { value: 0 },
          totalPurchase: { value: 500 },
        },
        client: { id: 'client-1' },
      },
    });

    const inventoryTaskWrite = tx.set.mock.calls.find(
      ([ref]) =>
        ref.path ===
        'businesses/business-1/invoicesV2/cart-service/outbox/task-inventory',
    );
    expect(inventoryTaskWrite?.[1]).toMatchObject({
      type: 'updateInventory',
      payload: {
        products: [
          expect.objectContaining({
            id: 'service-1',
            itemType: 'service',
            trackInventory: false,
            productStockId: null,
            batchId: null,
            selectedSaleUnit: null,
            weightDetail: { isSoldByWeight: false },
          }),
        ],
      },
    });
  });

  it('deriva snapshot monetario sin confiar en cart.monetary del cliente', async () => {
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    const trustedMonetary = {
      documentCurrency: { code: 'DOP' },
      functionalCurrency: { code: 'DOP' },
      totals: { subtotal: 200, taxes: 36, total: 236, paid: 236 },
      functionalTotals: { subtotal: 200, taxes: 36, total: 236, paid: 236 },
    };
    resolvePilotMonetarySnapshotForBusinessMock.mockResolvedValue(
      trustedMonetary,
    );

    await createPendingInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      idempotencyKey: 'idem-1',
      payload: {
        cart: {
          id: 'cart-monetary',
          products: [{ id: 'p1', name: 'Producto A', amountToBuy: 2 }],
          payment: { value: 236 },
          totalPurchaseWithoutTaxes: { value: 200 },
          totalTaxes: { value: 36 },
          totalPurchase: { value: 236 },
          monetary: {
            documentCurrency: { code: 'USD' },
            functionalCurrency: { code: 'DOP' },
            totals: { total: 1, taxes: 0 },
            functionalTotals: { total: 1, taxes: 0 },
          },
        },
        client: { id: 'client-1' },
      },
    });

    expect(resolvePilotMonetarySnapshotForBusinessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        monetary: null,
        source: expect.objectContaining({
          id: 'cart-monetary',
          monetary: expect.objectContaining({
            documentCurrency: { code: 'USD' },
          }),
        }),
        totals: {
          subtotal: 200,
          taxes: 36,
          total: 236,
          paid: 236,
        },
        capturedBy: 'user-1',
      }),
    );

    const invoiceWrite = tx.set.mock.calls.find(
      ([ref]) =>
        ref.path === 'businesses/business-1/invoicesV2/cart-monetary',
    );
    expect(invoiceWrite?.[1].snapshot.monetary).toBe(trustedMonetary);

    const canonicalTaskWrite = tx.set.mock.calls.find(
      ([, data]) => data?.type === 'createCanonicalInvoice',
    );
    expect(canonicalTaskWrite?.[1].payload.cart.monetary).toBe(
      trustedMonetary,
    );
  });

  it('programa setupAR con CxC saneada y no con totalReceivable manipulado', async () => {
    nanoidMock.mockReset();
    nanoidMock
      .mockReturnValueOnce('task-inventory')
      .mockReturnValueOnce('task-canonical')
      .mockReturnValueOnce('task-cash-count')
      .mockReturnValueOnce('task-ar')
      .mockReturnValueOnce('task-credit-notes');

    const result = await createPendingInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      idempotencyKey: 'idem-1',
      payload: {
        cart: {
          id: 'cart-ar',
          products: [{ id: 'p1', name: 'Producto A', amountToBuy: 1 }],
          totalPurchaseWithoutTaxes: { value: 200 },
          totalTaxes: { value: 36 },
          totalPurchase: { value: 236 },
          payment: { value: 60 },
          paymentMethod: [
            { method: 'cash', status: true, value: 40 },
            { method: 'creditNote', status: true, value: 20 },
          ],
          creditNotePayment: [{ id: 'credit-note-1', amountUsed: 20 }],
          isAddedToReceivables: true,
        },
        client: { id: 'client-1' },
        accountsReceivable: {
          clientId: 'client-spoof',
          totalReceivable: 1,
          currentBalance: 1,
          totalInstallments: 4,
          paymentFrequency: 'monthly',
        },
      },
    });

    expect(result).toMatchObject({
      invoiceId: 'cart-ar',
      status: 'pending',
    });

    const arTaskWrite = tx.set.mock.calls.find(
      ([, data]) => data?.type === 'setupAR',
    );
    expect(arTaskWrite?.[0].path).toBe(
      'businesses/business-1/invoicesV2/cart-ar/outbox/task-ar',
    );
    expect(arTaskWrite?.[1].payload).toMatchObject({
      businessId: 'business-1',
      userId: 'user-1',
      clientId: 'client-1',
      ar: {
        invoiceId: 'cart-ar',
        clientId: 'client-1',
        totalReceivable: 176,
        currentBalance: 176,
        remainingBalance: 176,
        arBalance: 176,
        installmentAmount: 44,
        totalInstallments: 4,
        paymentFrequency: 'monthly',
        createdAt: new Date('2026-03-17T00:00:00.000Z').getTime(),
        updatedAt: new Date('2026-03-17T00:00:00.000Z').getTime(),
      },
    });

    const creditNoteTaskWrite = tx.set.mock.calls.find(
      ([, data]) => data?.type === 'consumeCreditNotes',
    );
    expect(creditNoteTaskWrite?.[1].payload.creditNotes).toEqual([
      {
        id: 'credit-note-1',
        ncf: null,
        amountUsed: 20,
        originalAmount: null,
      },
    ]);
  });

  it('normalizes legacy saleUnit payloads into selectedSaleUnit for inventory tasks', async () => {
    await createPendingInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      idempotencyKey: 'idem-1',
      payload: {
        cart: {
          id: 'cart-legacy-sale-unit',
          products: [
            {
              id: 'p1',
              name: 'Producto A',
              amountToBuy: 2,
              saleUnit: {
                id: 'pack-6',
                unitName: 'Paquete',
                barcode: 'PK6',
                quantity: 6,
                pricing: {
                  currency: 'DOP',
                  price: 150,
                  listPrice: 150,
                  tax: 18,
                },
              },
              trackInventory: true,
            },
          ],
          payment: { value: 300 },
          totalPurchaseWithoutTaxes: { value: 300 },
          totalTaxes: { value: 54 },
          totalPurchase: { value: 354 },
        },
        client: { id: 'client-1' },
      },
    });

    const inventoryTaskWrite = tx.set.mock.calls.find(
      ([ref]) =>
        ref.path ===
        'businesses/business-1/invoicesV2/cart-legacy-sale-unit/outbox/task-inventory',
    );
    expect(inventoryTaskWrite?.[1]).toMatchObject({
      type: 'updateInventory',
      payload: {
        products: [
          expect.objectContaining({
            id: 'p1',
            amountToBuy: 2,
            selectedSaleUnit: expect.objectContaining({
              id: 'pack-6',
              unitName: 'Paquete',
              barcode: 'PK6',
              quantity: 6,
              conversionFactorToBase: undefined,
              allowFractional: false,
              pricing: {
                currency: 'DOP',
                price: 150,
                listPrice: 150,
                tax: 18,
              },
            }),
          }),
        ],
      },
    });
  });

  it('rejects enabled NCF requests when the type is missing', async () => {
    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        payload: {
          cart: {},
          ncf: {
            enabled: true,
          },
        },
      }),
    ).rejects.toThrow('ncfType requerido cuando ncf.enabled=true');
  });

  it('rejects fiscal credit invoices without an identified client', async () => {
    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        payload: {
          cart: {
            id: 'cart-fiscal-credit',
            products: [{ id: 'p1', name: 'Producto A', amountToBuy: 1 }],
            payment: { value: 118 },
            totalPurchaseWithoutTaxes: { value: 100 },
            totalTaxes: { value: 18 },
            totalPurchase: { value: 118 },
          },
          client: { id: 'GC-0000', name: 'Cliente Generico' },
          taxReceiptEnabled: true,
          ncf: {
            enabled: true,
            type: 'CREDITO FISCAL',
          },
        },
      }),
    ).rejects.toThrow(
      'Selecciona un cliente con RNC o cedula para este comprobante fiscal.',
    );

    expect(reserveNcfMock).not.toHaveBeenCalled();
    expect(tx.set).not.toHaveBeenCalled();
  });

  it('rejects consumer final invoices at the 607 detail threshold without an identified client', async () => {
    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        payload: {
          cart: {
            id: 'cart-consumer-high',
            products: [{ id: 'p1', name: 'Producto A', amountToBuy: 1 }],
            payment: { value: 250000 },
            totalPurchaseWithoutTaxes: { value: 211864.41 },
            totalTaxes: { value: 38135.59 },
            totalPurchase: { value: 250000 },
          },
          client: null,
          taxReceiptEnabled: true,
          ncf: {
            enabled: true,
            type: 'fiscal-consumer',
          },
        },
      }),
    ).rejects.toThrow(
      'Selecciona un cliente con RNC o cedula para este comprobante fiscal.',
    );

    expect(reserveNcfMock).not.toHaveBeenCalled();
    expect(tx.set).not.toHaveBeenCalled();
  });

  it('schedules an electronic receipt shadow task without reserving legacy NCF', async () => {
    nanoidMock
      .mockReset()
      .mockReturnValueOnce('task-inventory')
      .mockReturnValueOnce('task-canonical')
      .mockReturnValueOnce('task-electronic')
      .mockReturnValueOnce('task-cash-count');

    tx.get.mockImplementation(async (ref) => {
      if (ref.path === 'idempotency:business-1:idem-1') {
        return { exists: false };
      }
      if (ref.path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            features: {
              fiscal: {
                electronicModelEnabled: true,
                electronicTransportEnabled: false,
                gisysFact: {
                  enabled: true,
                  integrationInstanceCode: 'vm-local',
                  taxpayerCode: '132619201',
                  mode: 'pilot',
                },
              },
            },
            subscription: {
              status: 'active',
              planId: 'plus',
              limits: { monthlyInvoices: 10 },
            },
          }),
        };
      }
      if (ref.path === 'businesses/business-1/usage/current') {
        return { exists: true, data: () => ({ monthlyInvoices: 2 }) };
      }
      if (ref.path.startsWith('businesses/business-1/usage/monthly/entries/')) {
        return { exists: true, data: () => ({ monthlyInvoices: 3 }) };
      }
      if (ref.path === 'businesses/business-1/settings/accounting') {
        return { exists: false, data: () => ({}) };
      }
      if (ref.path === 'businesses/business-1/settings/taxReceipt') {
        return { exists: true, data: () => ({ taxReceiptEnabled: true }) };
      }
      if (
        ref.path.startsWith('businesses/business-1/accountingPeriodClosures/')
      ) {
        return { exists: false, data: () => ({}) };
      }
      if (ref.path === 'platformConfig/gisysFact') {
        return { exists: false, data: () => ({}) };
      }
      throw new Error(`Unexpected tx.get path: ${ref.path}`);
    });

    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        payload: {
          cart: {
            id: 'cart-ecf-shadow',
            products: [{ id: 'p1', name: 'Producto A', amountToBuy: 1 }],
            payment: { value: 118 },
            totalPurchaseWithoutTaxes: { value: 100 },
            totalTaxes: { value: 18 },
            totalPurchase: { value: 118 },
          },
          taxReceiptEnabled: true,
          ncf: {
            enabled: true,
            type: 'fiscal-consumer',
          },
        },
      }),
    ).resolves.toMatchObject({
      invoiceId: 'cart-ecf-shadow',
      status: 'pending',
    });

    expect(reserveNcfMock).not.toHaveBeenCalled();

    const invoiceWrite = tx.set.mock.calls.find(
      ([ref]) =>
        ref.path === 'businesses/business-1/invoicesV2/cart-ecf-shadow',
    );
    expect(invoiceWrite[1].snapshot).toEqual(
      expect.objectContaining({
        fiscalMode: 'electronic_ecf',
        documentFormat: 'electronic',
        electronicTaxReceipt: expect.objectContaining({
          mode: 'shadow',
          status: 'pending',
          documentType: 'E32',
          transportEnabled: false,
        }),
      }),
    );

    const electronicTaskWrite = tx.set.mock.calls.find(
      ([ref, data]) =>
        ref.path ===
          'businesses/business-1/invoicesV2/cart-ecf-shadow/outbox/task-electronic' &&
        data.type === 'issueElectronicTaxReceipt',
    );
    expect(electronicTaskWrite[1].payload).toEqual(
      expect.objectContaining({
        ncfType: 'fiscal-consumer',
        documentType: 'E32',
        transportEnabled: false,
        mode: 'shadow',
      }),
    );
  });

  it('uses legacy NCF when only the global GISYS runtime is enabled', async () => {
    reserveNcfMock.mockResolvedValue({
      ncfCode: 'B0200000001',
      usageId: 'usage-1',
    });

    tx.get.mockImplementation(async (ref) => {
      if (ref.path === 'idempotency:business-1:idem-1') {
        return { exists: false };
      }
      if (ref.path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            features: {
              fiscal: {
                gisysFact: {
                  enabled: true,
                  taxpayerCode: '132619201',
                },
              },
            },
            subscription: {
              status: 'active',
              planId: 'plus',
              limits: { monthlyInvoices: 10 },
            },
          }),
        };
      }
      if (ref.path === 'businesses/business-1/usage/current') {
        return { exists: true, data: () => ({ monthlyInvoices: 2 }) };
      }
      if (ref.path.startsWith('businesses/business-1/usage/monthly/entries/')) {
        return { exists: true, data: () => ({ monthlyInvoices: 3 }) };
      }
      if (ref.path === 'businesses/business-1/settings/accounting') {
        return { exists: false, data: () => ({}) };
      }
      if (ref.path === 'businesses/business-1/settings/taxReceipt') {
        return { exists: true, data: () => ({ taxReceiptEnabled: true }) };
      }
      if (
        ref.path.startsWith('businesses/business-1/accountingPeriodClosures/')
      ) {
        return { exists: false, data: () => ({}) };
      }
      if (ref.path === 'platformConfig/gisysFact') {
        return {
          exists: true,
          data: () => ({
            enabled: true,
            baseUrl: 'https://platform.gisys.example/api/v1',
            integrationInstanceCode: 'platform-instance',
            electronicModelEnabled: true,
            mode: 'required',
          }),
        };
      }
      throw new Error(`Unexpected tx.get path: ${ref.path}`);
    });

    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        payload: {
          cart: {
            id: 'cart-legacy-ncf',
            products: [{ id: 'p1', name: 'Producto A', amountToBuy: 1 }],
            payment: { value: 118 },
            totalPurchaseWithoutTaxes: { value: 100 },
            totalTaxes: { value: 18 },
            totalPurchase: { value: 118 },
          },
          taxReceiptEnabled: true,
          ncf: {
            enabled: true,
            type: 'fiscal-consumer',
          },
        },
      }),
    ).resolves.toMatchObject({
      invoiceId: 'cart-legacy-ncf',
      status: 'pending',
    });

    expect(reserveNcfMock).toHaveBeenCalledWith(tx, {
      businessId: 'business-1',
      userId: 'user-1',
      ncfType: 'fiscal-consumer',
    });

    const invoiceWrite = tx.set.mock.calls.find(
      ([ref]) =>
        ref.path === 'businesses/business-1/invoicesV2/cart-legacy-ncf',
    );
    expect(invoiceWrite[1].snapshot).toEqual(
      expect.objectContaining({
        ncf: expect.objectContaining({
          code: 'B0200000001',
          status: 'reserved',
          usageId: 'usage-1',
        }),
      }),
    );
    expect(invoiceWrite[1].snapshot.electronicTaxReceipt).toBeUndefined();
  });

  it('blocks invoices without NCF when fiscal receipts are enabled for the business', async () => {
    tx.get.mockImplementation(async (ref) => {
      if (ref.path === 'idempotency:business-1:idem-1') {
        return { exists: false };
      }
      if (ref.path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            subscription: {
              status: 'active',
              planId: 'plus',
              limits: { monthlyInvoices: 10 },
            },
          }),
        };
      }
      if (ref.path === 'businesses/business-1/usage/current') {
        return { exists: true, data: () => ({ monthlyInvoices: 2 }) };
      }
      if (ref.path.startsWith('businesses/business-1/usage/monthly/entries/')) {
        return { exists: true, data: () => ({ monthlyInvoices: 3 }) };
      }
      if (ref.path === 'businesses/business-1/settings/accounting') {
        return { exists: false, data: () => ({}) };
      }
      if (ref.path === 'businesses/business-1/settings/taxReceipt') {
        return {
          exists: true,
          data: () => ({
            taxReceiptEnabled: true,
          }),
        };
      }
      if (
        ref.path.startsWith('businesses/business-1/accountingPeriodClosures/')
      ) {
        return { exists: false, data: () => ({}) };
      }
      if (ref.path === 'platformConfig/gisysFact') {
        return { exists: false, data: () => ({}) };
      }
      throw new Error(`Unexpected tx.get path: ${ref.path}`);
    });

    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        payload: {
          cart: {
            id: 'cart-no-ncf',
          },
          taxReceiptEnabled: false,
          ncf: {
            enabled: false,
            type: null,
          },
        },
      }),
    ).rejects.toThrow(
      'Debes seleccionar un comprobante fiscal para completar la venta.',
    );

    expect(tx.set).not.toHaveBeenCalled();
  });

  it('blocks the invoice when the effective accounting period is closed', async () => {
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);

    tx.get.mockImplementation(async (ref) => {
      if (ref.path === 'idempotency:business-1:idem-1') {
        return { exists: false };
      }
      if (ref.path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            subscription: {
              status: 'active',
              planId: 'plus',
              limits: { monthlyInvoices: 10 },
            },
          }),
        };
      }
      if (ref.path === 'businesses/business-1/usage/current') {
        return { exists: true, data: () => ({ monthlyInvoices: 2 }) };
      }
      if (ref.path.startsWith('businesses/business-1/usage/monthly/entries/')) {
        return { exists: true, data: () => ({ monthlyInvoices: 3 }) };
      }
      if (ref.path === 'businesses/business-1/settings/accounting') {
        return {
          exists: true,
          data: () => ({
            generalAccountingEnabled: true,
          }),
        };
      }
      if (ref.path === 'businesses/business-1/settings/taxReceipt') {
        return { exists: true, data: () => ({ taxReceiptEnabled: false }) };
      }
      if (
        ref.path === 'businesses/business-1/accountingPeriodClosures/2026-03'
      ) {
        return {
          exists: true,
          data: () => ({
            periodKey: '2026-03',
            status: 'closed',
          }),
        };
      }
      if (ref.path === 'platformConfig/gisysFact') {
        return { exists: false, data: () => ({}) };
      }
      throw new Error(`Unexpected tx.get path: ${ref.path}`);
    });

    await expect(
      createPendingInvoice({
        businessId: 'business-1',
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        payload: {
          cart: {
            id: 'cart-closed',
            date: '2026-03-10T15:00:00.000Z',
            payment: { value: 250 },
            totalPurchaseWithoutTaxes: { value: 200 },
            totalTaxes: { value: 36 },
            totalPurchase: { value: 236 },
          },
        },
      }),
    ).rejects.toThrow(
      'No puedes registrar esta factura con fecha de marzo de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
    );

    expect(tx.set).not.toHaveBeenCalled();
  });

  it('allows the invoice when accounting is enabled and the effective period is open', async () => {
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);

    tx.get.mockImplementation(async (ref) => {
      if (ref.path === 'idempotency:business-1:idem-1') {
        return { exists: false };
      }
      if (ref.path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            subscription: {
              status: 'active',
              planId: 'plus',
              limits: { monthlyInvoices: 10 },
            },
          }),
        };
      }
      if (ref.path === 'businesses/business-1/usage/current') {
        return { exists: true, data: () => ({ monthlyInvoices: 2 }) };
      }
      if (ref.path.startsWith('businesses/business-1/usage/monthly/entries/')) {
        return { exists: true, data: () => ({ monthlyInvoices: 3 }) };
      }
      if (ref.path === 'businesses/business-1/settings/accounting') {
        return {
          exists: true,
          data: () => ({
            generalAccountingEnabled: true,
          }),
        };
      }
      if (ref.path === 'businesses/business-1/settings/taxReceipt') {
        return { exists: true, data: () => ({ taxReceiptEnabled: false }) };
      }
      if (
        ref.path === 'businesses/business-1/accountingPeriodClosures/2026-03'
      ) {
        return { exists: false, data: () => ({}) };
      }
      if (ref.path === 'platformConfig/gisysFact') {
        return { exists: false, data: () => ({}) };
      }
      throw new Error(`Unexpected tx.get path: ${ref.path}`);
    });

    const result = await createPendingInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      idempotencyKey: 'idem-1',
      cashCountId: 'cash-1',
      payload: {
        cart: {
          id: 'cart-open',
          date: '2026-03-10T15:00:00.000Z',
          payment: { value: 250 },
          totalPurchaseWithoutTaxes: { value: 200 },
          totalTaxes: { value: 36 },
          totalPurchase: { value: 236 },
        },
      },
    });

    expect(result).toEqual({
      invoiceId: 'cart-open',
      status: 'pending',
      alreadyExists: false,
    });
    expect(tx.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountingPeriodClosures/2026-03',
      }),
    );
  });
});
