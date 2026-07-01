import { describe, expect, it } from 'vitest';

import reducer, {
  addInvoice,
  addProductInvoiceForm,
  changeAmountToBuyProduct,
} from './invoiceFormSlice';
import type { InvoiceData, InvoiceProduct } from '@/types/invoice';

describe('invoiceFormSlice quantity normalization', () => {
  it('keeps sold weight as the editable quantity and baseQuantity', () => {
    const weightedProduct: InvoiceProduct = {
      id: 'weighted-1',
      amountToBuy: 1,
      pricing: { price: 100, tax: 0 },
      weightDetail: {
        isSoldByWeight: true,
        weight: 2.5,
        weightUnit: 'kg',
      },
    };

    const state = reducer(
      undefined,
      addInvoice({
        invoice: {
          products: [weightedProduct],
        } as InvoiceData,
      }),
    );

    const product = state.invoice.products?.[0];
    expect(product?.amountToBuy).toBe(1);
    expect(product?.weightDetail?.weight).toBe(2.5);
    expect(product?.baseQuantity).toBe(2.5);
    expect(state.invoice.totalShoppingItems?.value).toBe(2.5);
    expect(state.invoice.totalPurchaseWithoutTaxes?.value).toBe(250);
  });

  it('updates weightDetail and totals when editing a weighted product', () => {
    const weightedProduct: InvoiceProduct = {
      id: 'weighted-1',
      amountToBuy: 1,
      pricing: { price: 100, tax: 0 },
      weightDetail: {
        isSoldByWeight: true,
        weight: 2.5,
      },
    };

    const initialState = reducer(
      undefined,
      addInvoice({
        invoice: {
          products: [weightedProduct],
        } as InvoiceData,
      }),
    );
    const state = reducer(
      initialState,
      changeAmountToBuyProduct({
        product: weightedProduct,
        type: 'change',
        amount: 3.25,
      }),
    );

    const product = state.invoice.products?.[0];
    expect(product?.amountToBuy).toBe(1);
    expect(product?.weightDetail?.weight).toBe(3.25);
    expect(product?.baseQuantity).toBe(3.25);
    expect(state.invoice.totalShoppingItems?.value).toBe(3.25);
    expect(state.invoice.totalPurchaseWithoutTaxes?.value).toBe(325);
  });

  it('recalculates baseQuantity for fractional sale units', () => {
    const boxProduct: InvoiceProduct = {
      id: 'box-1',
      amountToBuy: 1,
      pricing: { price: 10, tax: 0 },
      selectedSaleUnit: {
        id: 'half-box',
        unitName: 'Media caja',
        allowFractional: true,
        conversionFactorToBase: 12,
        pricing: { price: 120, tax: 0 },
      },
    };

    const initialState = reducer(
      undefined,
      addProductInvoiceForm({ product: boxProduct }),
    );
    const state = reducer(
      initialState,
      changeAmountToBuyProduct({
        product: boxProduct,
        type: 'change',
        amount: 0.5,
      }),
    );

    const product = state.invoice.products?.[0];
    expect(product?.amountToBuy).toBe(0.5);
    expect(product?.baseQuantity).toBe(6);
    expect(state.invoice.totalShoppingItems?.value).toBe(0.5);
    expect(state.invoice.totalPurchaseWithoutTaxes?.value).toBe(60);
  });

  it('does not merge the same product sold with different sale units', () => {
    const unitProduct: InvoiceProduct = {
      id: 'product-1',
      amountToBuy: 1,
      pricing: { price: 10, tax: 0 },
    };
    const boxProduct: InvoiceProduct = {
      id: 'product-1',
      amountToBuy: 1,
      pricing: { price: 10, tax: 0 },
      selectedSaleUnit: {
        id: 'box-12',
        unitName: 'Caja',
        conversionFactorToBase: 12,
        pricing: { price: 100, tax: 0 },
      },
    };

    const stateWithUnit = reducer(
      undefined,
      addProductInvoiceForm({ product: unitProduct }),
    );
    const state = reducer(
      stateWithUnit,
      addProductInvoiceForm({ product: boxProduct }),
    );

    expect(state.invoice.products).toHaveLength(2);
    expect(state.invoice.products?.[0]?.baseQuantity).toBe(1);
    expect(state.invoice.products?.[1]?.baseQuantity).toBe(12);
    expect(state.invoice.totalShoppingItems?.value).toBe(2);
  });
});
