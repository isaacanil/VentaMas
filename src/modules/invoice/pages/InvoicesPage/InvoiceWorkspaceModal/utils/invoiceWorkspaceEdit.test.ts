import { describe, expect, it } from 'vitest';

import type { InvoiceData, InvoiceProduct } from '@/types/invoice';

import {
  getWorkspaceEditProductQuantity,
  getWorkspaceProductQuantityInputConfig,
  recalculateWorkspaceInvoiceDraft,
  updateWorkspaceDraftProductQuantity,
} from './invoiceWorkspaceEdit';

const createInvoice = (products: InvoiceProduct[]): InvoiceData => ({
  id: 'invoice-draft',
  products,
  paymentMethod: [],
  discount: { type: 'percentage', value: 0 },
});

describe('invoiceWorkspaceEdit', () => {
  it('recalculates visible item totals from sold weight instead of legacy amount', () => {
    const draft = recalculateWorkspaceInvoiceDraft(
      createInvoice([
        {
          id: 'weighted-product',
          amountToBuy: 1,
          pricing: { price: 100, tax: 0 },
          weightDetail: {
            isSoldByWeight: true,
            weight: 2.5,
            weightUnit: 'kg',
          },
        },
      ]),
    );

    expect(draft.totalShoppingItems?.value).toBe(2.5);
    expect(draft.totalPurchase?.value).toBe(250);
  });

  it('updates weight and base quantity when editing a weighted line', () => {
    const draft = updateWorkspaceDraftProductQuantity(
      createInvoice([
        {
          id: 'weighted-product',
          amountToBuy: 1,
          pricing: { price: 100, tax: 0 },
          weightDetail: {
            isSoldByWeight: true,
            weight: 2.5,
            weightUnit: 'kg',
          },
        },
      ]),
      'weighted-product',
      3.25,
    );

    const product = draft.products?.[0];
    expect(product?.amountToBuy).toBe(1);
    expect(product?.weightDetail?.weight).toBe(3.25);
    expect(product?.baseQuantity).toBe(3.25);
    expect(getWorkspaceEditProductQuantity(product)).toBe(3.25);
    expect(draft.totalShoppingItems?.value).toBe(3.25);
    expect(draft.totalPurchase?.value).toBe(325);
  });

  it('keeps fractional sale unit edits commercial and recalculates base quantity', () => {
    const draft = updateWorkspaceDraftProductQuantity(
      createInvoice([
        {
          id: 'box-product',
          amountToBuy: 1,
          pricing: { price: 15, tax: 0 },
          selectedSaleUnit: {
            id: 'box-12',
            unitName: 'Caja',
            allowFractional: true,
            conversionFactorToBase: 12,
            pricing: { price: 120, tax: 0 },
          },
        },
      ]),
      'box-product',
      0.5,
    );

    const product = draft.products?.[0];
    expect(product?.amountToBuy).toBe(0.5);
    expect(product?.baseQuantity).toBe(6);
    expect(getWorkspaceEditProductQuantity(product)).toBe(0.5);
    expect(getWorkspaceProductQuantityInputConfig(product)).toEqual({
      min: 0.01,
      step: 0.01,
    });
    expect(draft.totalShoppingItems?.value).toBe(0.5);
    expect(draft.totalPurchase?.value).toBe(60);
  });
});
