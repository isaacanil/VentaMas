import { describe, expect, it, vi } from 'vitest';

import reducer, {
  addProduct,
  changeProductPrice,
  changeProductWeight,
  clearCreditNotePayment,
  loadCart,
  onChangeValueAmountToProduct,
  setAccountingContext,
  setCreditNotePayment,
  selectTotalIndividualDiscounts,
  updateInsuranceStatus,
  updateProductFields,
} from './cartSlice';
import type { Product } from './types';

const createCartProduct = (overrides: Partial<Product> = {}): Product => ({
  id: overrides.id ?? 'product-1',
  cid: overrides.cid ?? overrides.id ?? 'product-1',
  name: 'Producto de prueba',
  amountToBuy: 1,
  pricing: {
    currency: 'DOP',
    listPrice: 10,
    price: 10,
  },
  selectedSaleUnit: null,
  cost: {
    total: 10,
  },
  insurance: {
    mode: null,
    value: 0,
  },
  ...overrides,
});

describe('cartSlice', () => {
  it('separa lineas por lote o ubicacion y fusiona solo la misma existencia fisica', () => {
    let state = reducer(
      undefined,
      addProduct(
        createCartProduct({
          id: 'medicine-1',
          productStockId: 'stock-a',
          batchId: 'batch-a',
          stock: 5,
        }),
      ),
    );

    state = reducer(
      state,
      addProduct(
        createCartProduct({
          id: 'medicine-1',
          productStockId: 'stock-b',
          batchId: 'batch-b',
          stock: 3,
        }),
      ),
    );

    state = reducer(
      state,
      addProduct(
        createCartProduct({
          id: 'medicine-1',
          productStockId: 'stock-b',
          batchId: 'batch-b',
          stock: 3,
        }),
      ),
    );

    expect(state.data.products).toHaveLength(2);
    expect(state.data.products[0]?.cid).toBe('medicine-1::stock-a::batch-a');
    expect(state.data.products[0]?.amountToBuy).toBe(1);
    expect(state.data.products[1]?.cid).toBe('medicine-1::stock-b::batch-b');
    expect(state.data.products[1]?.amountToBuy).toBe(2);
  });

  it('separa lineas por unidad de venta y calcula la cantidad base', () => {
    let state = reducer(
      undefined,
      addProduct(
        createCartProduct({
          id: 'soda-1',
          selectedSaleUnit: null,
        }),
      ),
    );

    state = reducer(
      state,
      addProduct(
        createCartProduct({
          id: 'soda-1',
          selectedSaleUnit: {
            id: 'box-12',
            unitName: 'Caja',
            quantity: 12,
            pricing: {
              price: 480,
            },
          },
        }),
      ),
    );

    state = reducer(
      state,
      addProduct(
        createCartProduct({
          id: 'soda-1',
          selectedSaleUnit: {
            id: 'box-12',
            unitName: 'Caja',
            quantity: 12,
            pricing: {
              price: 480,
            },
          },
        }),
      ),
    );

    expect(state.data.products).toHaveLength(2);
    expect(state.data.products[0]?.cid).toBe('soda-1');
    expect(state.data.products[0]?.amountToBuy).toBe(1);
    expect(state.data.products[0]?.baseQuantity).toBe(1);
    expect(state.data.products[1]?.cid).toBe('soda-1::sale-unit::box-12');
    expect(state.data.products[1]?.amountToBuy).toBe(2);
    expect(state.data.products[1]?.selectedSaleUnit?.id).toBe('box-12');
    expect(state.data.products[1]?.baseQuantity).toBe(24);

    state = reducer(
      state,
      onChangeValueAmountToProduct({
        id: 'soda-1::sale-unit::box-12',
        value: 3,
      }),
    );

    expect(state.data.products[0]?.amountToBuy).toBe(1);
    expect(state.data.products[0]?.baseQuantity).toBe(1);
    expect(state.data.products[1]?.amountToBuy).toBe(3);
    expect(state.data.products[1]?.baseQuantity).toBe(36);

    state = reducer(
      state,
      updateProductFields({
        id: 'soda-1::sale-unit::box-12',
        data: {
          productStockId: 'stock-1',
          batchId: 'batch-1',
          cid: 'soda-1::stock-1::batch-1::sale-unit::box-12',
        },
      }),
    );

    expect(state.data.products[0]?.cid).toBe('soda-1');
    expect(state.data.products[0]?.productStockId).toBeUndefined();
    expect(state.data.products[1]?.cid).toBe(
      'soda-1::stock-1::batch-1::sale-unit::box-12',
    );
    expect(state.data.products[1]?.productStockId).toBe('stock-1');
  });

  it('apunta cambios de precio y campos a la linea correcta usando cid', () => {
    let state = reducer(
      undefined,
      addProduct(
        createCartProduct({
          id: 'medicine-2',
          productStockId: 'stock-a',
          batchId: 'batch-a',
        }),
      ),
    );

    state = reducer(
      state,
      addProduct(
        createCartProduct({
          id: 'medicine-2',
          productStockId: 'stock-b',
          batchId: 'batch-b',
        }),
      ),
    );

    state = reducer(
      state,
      changeProductPrice({
        id: 'medicine-2::stock-b::batch-b',
        price: 18,
      }),
    );

    state = reducer(
      state,
      updateProductFields({
        id: 'medicine-2::stock-b::batch-b',
        data: { comment: 'Linea B' },
      }),
    );

    expect(state.data.products[0]?.pricing?.price).toBe(10);
    expect(state.data.products[0]?.comment).toBeUndefined();
    expect(state.data.products[1]?.pricing?.price).toBe(18);
    expect(state.data.products[1]?.comment).toBe('Linea B');
  });

  it('guarda la unidad de venta seleccionada al cambiar precio', () => {
    let state = reducer(
      undefined,
      addProduct(createCartProduct({ id: 'rice-1' })),
    );

    state = reducer(
      state,
      changeProductPrice({
        id: 'rice-1',
        price: 350,
        saleUnit: {
          id: 'pack-5',
          unitName: 'Paquete',
          quantity: 5,
          pricing: {
            price: 320,
          },
        },
      }),
    );

    expect(state.data.products[0]?.selectedSaleUnit).toEqual(
      expect.objectContaining({
        id: 'pack-5',
        unitName: 'Paquete',
        quantity: 5,
        conversionFactorToBase: 5,
        pricing: expect.objectContaining({
          price: 350,
        }),
      }),
    );
    expect(state.data.products[0]?.baseQuantity).toBe(5);
  });

  it('permite fijar explicitamente precio cero en la linea del carrito', () => {
    let state = reducer(
      undefined,
      addProduct(
        createCartProduct({
          id: 'promo-1',
          pricing: {
            price: 100,
            listPrice: 100,
          },
        }),
      ),
    );

    state = reducer(
      state,
      changeProductPrice({
        id: 'promo-1',
        price: 0,
      }),
    );

    expect(state.data.products[0]?.pricing?.price).toBe(0);
  });

  it('refresca el precio de una linea fusionada cuando no fue editado manualmente', () => {
    let state = reducer(
      undefined,
      addProduct(
        createCartProduct({
          id: 'sync-price-1',
          pricing: {
            price: 100,
            listPrice: 100,
          },
        }),
      ),
    );

    state = reducer(
      state,
      addProduct(
        createCartProduct({
          id: 'sync-price-1',
          pricing: {
            price: 125,
            listPrice: 125,
          },
        }),
      ),
    );

    expect(state.data.products).toHaveLength(1);
    expect(state.data.products[0]?.amountToBuy).toBe(2);
    expect(state.data.products[0]?.pricing?.price).toBe(125);
    expect(state.data.products[0]?.pricing?.listPrice).toBe(125);
  });

  it('preserva el precio manual cuando vuelve a fusionar el mismo producto', () => {
    let state = reducer(
      undefined,
      addProduct(
        createCartProduct({
          id: 'manual-price-1',
          pricing: {
            price: 100,
            listPrice: 100,
          },
        }),
      ),
    );

    state = reducer(
      state,
      changeProductPrice({
        id: 'manual-price-1',
        price: 80,
        manualOverride: true,
      }),
    );

    state = reducer(
      state,
      addProduct(
        createCartProduct({
          id: 'manual-price-1',
          pricing: {
            price: 125,
            listPrice: 125,
          },
        }),
      ),
    );

    expect(state.data.products).toHaveLength(1);
    expect(state.data.products[0]?.amountToBuy).toBe(2);
    expect(state.data.products[0]?.pricing?.price).toBe(80);
    expect(state.data.products[0]?.pricingSource?.mode).toBe('manual-price');
  });

  it('actualiza la cantidad base cuando cambia el peso', () => {
    let state = reducer(
      undefined,
      addProduct(
        createCartProduct({
          id: 'ham-1',
          weightDetail: {
            isSoldByWeight: true,
            weight: 1.5,
          },
        }),
      ),
    );

    expect(state.data.products[0]?.baseQuantity).toBe(1.5);

    state = reducer(
      state,
      changeProductWeight({
        id: 'ham-1',
        weight: 2.25,
      }),
    );

    expect(state.data.products[0]?.weightDetail?.weight).toBe(2.25);
    expect(state.data.products[0]?.baseQuantity).toBe(2.25);
  });

  it('convierte peso vendido en libras a cantidad base de inventario', () => {
    let state = reducer(
      undefined,
      addProduct(
        createCartProduct({
          id: 'ham-lb-1',
          weightDetail: {
            isSoldByWeight: true,
            weight: 2,
            weightUnit: 'lb',
          },
        }),
      ),
    );

    expect(state.data.products[0]?.weightDetail?.weight).toBe(2);
    expect(state.data.products[0]?.baseQuantity).toBe(0.907185);

    state = reducer(
      state,
      changeProductWeight({
        id: 'ham-lb-1',
        weight: 3,
      }),
    );

    expect(state.data.products[0]?.weightDetail?.weight).toBe(3);
    expect(state.data.products[0]?.baseQuantity).toBe(1.360777);
  });

  it('calcula descuentos individuales solo con el precio activo canonico', () => {
    const state = reducer(
      undefined,
      addProduct(
        createCartProduct({
          price: { unit: 999 },
          pricing: {
            currency: 'DOP',
            listPrice: 0,
            price: 0,
            tax: 18,
          },
          discount: {
            type: 'percentage',
            value: 10,
          },
        }),
      ),
    );

    expect(
      selectTotalIndividualDiscounts({
        cart: state,
        taxReceipt: { enabled: true },
      }),
    ).toBe(0);
  });

  it('calcula descuentos individuales de productos por peso usando el peso vendido', () => {
    const state = reducer(
      undefined,
      addProduct(
        createCartProduct({
          id: 'weighted-discount-1',
          amountToBuy: 1,
          weightDetail: {
            isSoldByWeight: true,
            weight: 2.5,
            weightUnit: 'lb',
          },
          pricing: {
            currency: 'DOP',
            listPrice: 100,
            price: 100,
            tax: 18,
          },
          discount: {
            type: 'percentage',
            value: 10,
          },
        }),
      ),
    );

    expect(
      selectTotalIndividualDiscounts({
        cart: {
          ...state,
          settings: {
            ...state.settings,
            fiscal: {
              ...state.settings.fiscal,
              taxationEnabled: true,
            },
          },
        },
        taxReceipt: { enabled: true },
      }),
    ).toBe(29.5);
  });

  it('normaliza el cid al cargar lineas antiguas con existencia fisica', () => {
    const state = reducer(
      undefined,
      loadCart({
        id: 'cart-1',
        products: [
          createCartProduct({
            id: 'medicine-3',
            cid: 'legacy-line',
            productStockId: 'stock-z',
            batchId: 'batch-z',
          }),
          createCartProduct({
            id: 'service-1',
            cid: '',
          }),
        ],
      }),
    );

    expect(state.data.products[0]?.cid).toBe('medicine-3::stock-z::batch-z');
    expect(state.data.products[1]?.cid).toBe('service-1');
  });

  it('normaliza timestamps, monedas, tasas y overrides al cargar un carrito serializado', () => {
    const state = reducer(
      undefined,
      loadCart({
        id: 'cart-2',
        preorderDetails: {
          date: {
            seconds: 1710000000,
            nanoseconds: 0,
          },
        },
        history: [
          {
            date: {
              seconds: 1710000123,
              nanoseconds: 0,
            },
          },
        ],
        documentCurrency: 'usd',
        functionalCurrency: 'eur',
        manualRatesByCurrency: {
          USD: {
            purchase: '58.5',
            sale: '59.25',
          },
        },
        exchangeRate: '60.5',
        rateOverride: {
          applied: true,
          value: '61.25',
          reason: ' manual ',
        },
      } as never),
    );

    expect(state.data.preorderDetails.date).toBe(1710000000 * 1000);
    expect(state.data.history[0]?.date).toBe(1710000123 * 1000);
    expect(state.data.documentCurrency).toBe('USD');
    expect(state.data.functionalCurrency).toBe('EUR');
    expect(state.data.manualRatesByCurrency).toEqual({
      USD: {
        buyRate: 58.5,
        sellRate: 59.25,
      },
    });
    expect(state.data.exchangeRate).toBe(60.5);
    expect(state.data.rateOverride).toEqual({
      applied: true,
      value: 61.25,
      reason: 'manual',
    });
  });

  it('no fusiona productos vendidos por peso aunque compartan el mismo id', () => {
    let state = reducer(
      undefined,
      addProduct(
        createCartProduct({
          id: 'weighted-1',
          cid: '',
          weightDetail: {
            isSoldByWeight: true,
            weight: 1.2,
          },
        }),
      ),
    );

    state = reducer(
      state,
      addProduct(
        createCartProduct({
          id: 'weighted-1',
          cid: '',
          weightDetail: {
            isSoldByWeight: true,
            weight: 0.8,
          },
        }),
      ),
    );

    expect(state.data.products).toHaveLength(2);
    expect(state.data.products[0]?.cid).not.toBe(state.data.products[1]?.cid);
    expect(state.data.products[0]?.amountToBuy).toBe(1);
    expect(state.data.products[1]?.amountToBuy).toBe(1);
  });

  it('sincroniza la moneda documental con la funcional en ventas mixtas', () => {
    const loadedState = reducer(
      undefined,
      loadCart({
        id: 'cart-3',
        documentCurrency: 'USD',
        functionalCurrency: 'USD',
        mixedCurrencySale: true,
      } as never),
    );

    const state = reducer(
      loadedState,
      setAccountingContext({
        functionalCurrency: 'EUR',
        manualRatesByCurrency: {
          USD: {
            sale: 60,
            purchase: 59,
          },
        },
      }),
    );

    expect(state.data.functionalCurrency).toBe('EUR');
    expect(state.data.documentCurrency).toBe('EUR');
    expect(state.data.manualRatesByCurrency).toEqual({
      USD: {
        sellRate: 60,
        buyRate: 59,
      },
    });
  });

  it('registra pagos con notas de credito y limpia el metodo al removerlos', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-17T12:00:00.000Z'));

    try {
      const loadedState = reducer(
        undefined,
        loadCart({
          id: 'cart-4',
          totalPurchase: {
            value: 300,
          },
          paymentMethod: [
            {
              method: 'cash',
              value: 250,
              status: true,
            },
          ],
        } as never),
      );

      const creditedState = reducer(
        loadedState,
        setCreditNotePayment([
          {
            id: 'cn-1',
            amountToUse: 30,
            creditNote: {
              ncf: 'B0100000001',
              totalAmount: 90,
            },
          },
        ] as never),
      );

      expect(creditedState.data.creditNotePayment).toEqual([
        {
          id: 'cn-1',
          ncf: 'B0100000001',
          amountUsed: 30,
          originalAmount: 90,
          appliedDate: '2026-03-17T12:00:00.000Z',
        },
      ]);
      expect(creditedState.data.paymentMethod).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            method: 'creditNote',
            value: 30,
            status: true,
          }),
        ]),
      );

      const clearedState = reducer(creditedState, clearCreditNotePayment());

      expect(clearedState.data.creditNotePayment).toEqual([]);
      expect(clearedState.data.paymentMethod).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            method: 'creditNote',
            value: 0,
            status: false,
          }),
        ]),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('reinicia los montos de seguro al desactivar insuranceEnabled', () => {
    const loadedState = reducer(
      undefined,
      loadCart({
        id: 'cart-5',
        insuranceEnabled: true,
        products: [
          createCartProduct({
            id: 'insured-1',
            insurance: {
              mode: 'percentage',
              value: 25,
            },
          }),
        ],
      } as never),
    );

    const state = reducer(loadedState, updateInsuranceStatus(false));

    expect(state.data.insuranceEnabled).toBe(false);
    expect(state.data.products[0]?.insurance).toEqual({
      mode: null,
      value: 0,
    });
  });
});
