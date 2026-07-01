import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkOpenCashReconciliation: vi.fn(),
  doc: vi.fn(),
  flowTrace: vi.fn(),
  getDoc: vi.fn(),
  submitInvoice: vi.fn(),
  waitForInvoiceResult: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  getDoc: mocks.getDoc,
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: {},
}));

vi.mock('@/firebase/cashCount/cashReconciliationStatus.repository', () => ({
  checkOpenCashReconciliation: mocks.checkOpenCashReconciliation,
}));

vi.mock('@/utils/flowTrace', () => ({
  flowTrace: mocks.flowTrace,
}));

vi.mock('@/services/invoice/invoice.service', () => ({
  submitInvoice: mocks.submitInvoice,
  waitForInvoiceResult: mocks.waitForInvoiceResult,
}));

import {
  autoCompletePreorderInvoice,
  buildPreorderAutoCompleteIdempotencyKey,
} from '@/services/invoice/autoCompletePreorderInvoice';

const preorderData = {
  id: 'preorder-1',
  type: 'preorder',
  status: 'pending',
  client: { id: 'client-1', name: 'Client 1' },
  products: [{ id: 'product-1', name: 'Product 1', amountToBuy: 1 }],
  payment: { value: 0 },
  change: { value: 0 },
  payWith: { value: 0 },
  totalPurchase: { value: 100 },
  preorderDetails: {
    isOrWasPreorder: true,
    numberID: 'P-1',
    selectedTaxReceiptType: 'E32',
  },
};

const createSnap = (exists: boolean, data: unknown = null) => ({
  exists: () => exists,
  data: () => data,
});

const setupDefaultMocks = () => {
  mocks.doc.mockImplementation((_db: unknown, ...segments: string[]) => ({
    path: segments.join('/'),
  }));
  mocks.getDoc.mockImplementation(async (ref: { path?: string }) => {
    if (ref.path?.includes('/invoicesV2/')) {
      return createSnap(false);
    }
    return createSnap(true, { data: preorderData });
  });
  mocks.checkOpenCashReconciliation.mockResolvedValue({ state: 'open' });
  mocks.submitInvoice.mockImplementation(async (payload: any) => ({
    businessId: payload.businessId,
    idempotencyKey: payload.idempotencyKey,
    invoiceId: 'preorder-1',
    status: 'pending',
    userId: payload.user?.uid ?? 'user-1',
  }));
  mocks.waitForInvoiceResult.mockResolvedValue({
    canonical: null,
    invoice: { id: 'preorder-1', numberID: 'F-1' },
    invoiceMeta: null,
  });
};

describe('autoCompletePreorderInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('uses a stable idempotency key for retries of the same preorder conversion', async () => {
    const params = {
      businessId: 'business-1',
      userId: 'user-1',
      preorderId: 'preorder-1',
      taxReceiptEnabled: true,
      ncfType: 'E32',
    };

    await autoCompletePreorderInvoice(params);
    await autoCompletePreorderInvoice(params);

    const keys = mocks.submitInvoice.mock.calls.map(
      ([payload]) => payload.idempotencyKey,
    );

    expect(keys).toEqual([
      'auto-complete:v1:business-1:preorder-1',
      'auto-complete:v1:business-1:preorder-1',
    ]);
  });

  it('keeps the conversion key tied to the preorder when receipt inputs change', async () => {
    await autoCompletePreorderInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      preorderId: 'preorder-1',
      taxReceiptEnabled: true,
      ncfType: 'E31',
    });
    await autoCompletePreorderInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      preorderId: 'preorder-1',
      taxReceiptEnabled: true,
      ncfType: 'E32',
    });

    const submittedPayloads = mocks.submitInvoice.mock.calls.map(
      ([payload]) => payload,
    );

    expect(submittedPayloads[0].idempotencyKey).toBe(
      submittedPayloads[1].idempotencyKey,
    );
    expect(submittedPayloads[0].ncfType).toBe('E31');
    expect(submittedPayloads[1].ncfType).toBe('E32');
  });

  it('waits for an existing V2 attempt without requiring a new cash count check', async () => {
    mocks.getDoc.mockImplementation(async (ref: { path?: string }) => {
      if (ref.path?.includes('/invoicesV2/')) {
        return createSnap(true, { status: 'pending' });
      }
      return createSnap(true, { data: preorderData });
    });

    const result = await autoCompletePreorderInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      preorderId: 'preorder-1',
    });

    expect(result).toMatchObject({
      success: true,
      invoiceId: 'preorder-1',
    });
    expect(mocks.waitForInvoiceResult).toHaveBeenCalledWith({
      businessId: 'business-1',
      invoiceId: 'preorder-1',
    });
    expect(mocks.checkOpenCashReconciliation).not.toHaveBeenCalled();
    expect(mocks.submitInvoice).not.toHaveBeenCalled();
  });

  it('keeps preorder lines with structured sale-unit quantities', async () => {
    mocks.getDoc.mockImplementation(async (ref: { path?: string }) => {
      if (ref.path?.includes('/invoicesV2/')) {
        return createSnap(false);
      }
      return createSnap(true, {
        data: {
          ...preorderData,
          products: [
            {
              id: 'product-1',
              name: 'Boxed product',
              amountToBuy: { unit: 2, total: 24 },
              selectedSaleUnit: {
                id: 'box-12',
                quantity: 12,
              },
            },
          ],
        },
      });
    });

    await autoCompletePreorderInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      preorderId: 'preorder-1',
    });

    expect(mocks.submitInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        cart: expect.objectContaining({
          products: [
            expect.objectContaining({
              amountToBuy: { unit: 2, total: 24 },
              selectedSaleUnit: expect.objectContaining({
                id: 'box-12',
              }),
            }),
          ],
        }),
      }),
    );
  });

  it('does not submit a preorder invoice when a weighted product has an unsupported unit', async () => {
    mocks.getDoc.mockImplementation(async (ref: { path?: string }) => {
      if (ref.path?.includes('/invoicesV2/')) {
        return createSnap(false);
      }
      return createSnap(true, {
        data: {
          ...preorderData,
          products: [
            {
              id: 'product-weight',
              name: 'Queso fresco',
              amountToBuy: 1,
              weightDetail: {
                isSoldByWeight: true,
                weight: 2.5,
                weightUnit: 'unidad',
              },
            },
          ],
        },
      });
    });

    const result = await autoCompletePreorderInvoice({
      businessId: 'business-1',
      userId: 'user-1',
      preorderId: 'preorder-1',
    });

    expect(result).toEqual({
      success: false,
      error:
        'Uno o más productos vendidos por peso tienen una unidad de peso no soportada. Selecciona kg, lb, oz, g o mg antes de facturar.',
    });
    expect(mocks.checkOpenCashReconciliation).not.toHaveBeenCalled();
    expect(mocks.submitInvoice).not.toHaveBeenCalled();
    expect(mocks.flowTrace).toHaveBeenCalledWith(
      'PREORDER_AUTO_COMPLETE_INVALID_CART',
      expect.objectContaining({
        preorderId: 'preorder-1',
      }),
    );
  });

  it('sanitizes idempotency segments for Firestore document ids', () => {
    const key = buildPreorderAutoCompleteIdempotencyKey({
      businessId: 'business / 1',
      preorderId: 'pre/order 1',
    });

    expect(key).toBe('auto-complete:v1:business___1:pre_order_1');
    expect(key).not.toContain('/');
  });
});
