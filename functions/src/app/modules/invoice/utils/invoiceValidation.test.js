import { describe, expect, it } from 'vitest';

import {
  INVOICE_VALIDATION_CODES,
  validateInvoiceCart,
  validateInvoiceCartAgainstCatalog,
  validateInvoiceMonetaryConsistency,
} from './invoiceValidation.js';

const baseProduct = (overrides = {}) => ({
  id: 'product-1',
  amountToBuy: 2,
  pricing: {
    price: 100,
    tax: 18,
    currency: 'DOP',
  },
  ...overrides,
});

const buildCart = ({
  products = [baseProduct()],
  subtotal = 200,
  taxes = 36,
  total = 236,
  totalInsurance = 0,
  totalShoppingItems = 2,
  payment = total,
  change = 0,
  discount = { value: 0 },
  delivery = { value: 0 },
  extra = {},
} = {}) => ({
  products,
  discount,
  delivery,
  totalPurchaseWithoutTaxes: { value: subtotal },
  totalTaxes: { value: taxes },
  totalInsurance: { value: totalInsurance },
  totalShoppingItems: { value: totalShoppingItems },
  totalPurchase: { value: total },
  paymentMethod: [{ method: 'cash', status: true, value: payment }],
  payment: { value: payment },
  change: { value: change },
  functionalCurrency: 'DOP',
  ...extra,
});

const catalogProduct = (overrides = {}) => ({
  id: 'product-1',
  pricing: {
    price: 100,
    tax: 18,
    currency: 'DOP',
  },
  ...overrides,
});

const boxSaleUnit = (overrides = {}) => ({
  id: 'box-12',
  unitName: 'Caja',
  conversionFactorToBase: 12,
  pricing: {
    price: 150,
    tax: 18,
    currency: 'DOP',
  },
  active: true,
  ...overrides,
});

const buildCatalogLoader =
  ({ product = catalogProduct(), saleUnits = [] } = {}) =>
  async () => ({
    exists: true,
    product,
    saleUnits,
  });

const saleUnitCart = (selectedSaleUnit = boxSaleUnit(), overrides = {}) =>
  buildCart({
    products: [
      baseProduct({
        selectedSaleUnit,
      }),
    ],
    subtotal: 300,
    taxes: 54,
    total: 354,
    totalShoppingItems: 2,
    payment: 354,
    ...overrides,
  });

describe('invoiceValidation monetary consistency', () => {
  it('accepts a simple invoice without discount', () => {
    expect(validateInvoiceCart(buildCart())).toEqual({
      isValid: true,
      message: 'Cart validation passed.',
    });
  });

  it('accepts a correct line discount', () => {
    const cart = buildCart({
      products: [
        baseProduct({
          discount: {
            type: 'percentage',
            value: 10,
          },
        }),
      ],
      subtotal: 180,
      taxes: 32.4,
      total: 212.4,
      payment: 212.4,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({ isValid: true });
  });

  it('applies line discounts before tax for weighted products', () => {
    const cart = buildCart({
      products: [
        baseProduct({
          amountToBuy: 1,
          weightDetail: {
            isSoldByWeight: true,
            weight: 2.5,
            weightUnit: 'lb',
          },
          discount: {
            type: 'percentage',
            value: 10,
          },
        }),
      ],
      subtotal: 225,
      taxes: 40.5,
      total: 265.5,
      totalShoppingItems: 1,
      payment: 265.5,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({ isValid: true });
  });

  it('rejects a manipulated line discount snapshot', () => {
    const cart = buildCart({
      products: [
        baseProduct({
          discount: {
            type: 'percentage',
            value: 10,
          },
        }),
      ],
      subtotal: 190,
      taxes: 34.2,
      total: 224.2,
      payment: 224.2,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.MONETARY_SNAPSHOT_INCONSISTENT,
      message: expect.stringContaining('Subtotal inconsistente'),
    });
  });

  it('accepts a correct delivery value included in the final total', () => {
    const cart = buildCart({
      delivery: { value: 50 },
      total: 286,
      payment: 286,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({ isValid: true });
  });

  it('rejects a manipulated delivery total', () => {
    const cart = buildCart({
      delivery: { value: 50 },
      total: 236,
      payment: 236,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      message: expect.stringContaining('Total inconsistente'),
    });
  });

  it('accepts a correct insurance value', () => {
    const cart = buildCart({
      products: [
        baseProduct({
          insurance: {
            mode: 'fijo',
            value: 5,
          },
        }),
      ],
      totalInsurance: 10,
      total: 226,
      payment: 226,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({ isValid: true });
  });

  it('rejects manipulated insurance', () => {
    const cart = buildCart({
      products: [
        baseProduct({
          insurance: {
            mode: 'fijo',
            value: 5,
          },
        }),
      ],
      totalInsurance: 5,
      total: 231,
      payment: 231,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      message: expect.stringContaining('Seguro inconsistente'),
    });
  });

  it('rejects manipulated ITBIS', () => {
    const cart = buildCart({
      taxes: 30,
      total: 230,
      payment: 230,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      message: expect.stringContaining('ITBIS inconsistente'),
    });
  });

  it('rejects manipulated final total', () => {
    const cart = buildCart({
      total: 118,
      payment: 118,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      message: expect.stringContaining('Total inconsistente'),
    });
  });

  it('rejects document currency that differs from functional currency', () => {
    const cart = buildCart({
      extra: {
        documentCurrency: 'USD',
        functionalCurrency: 'DOP',
      },
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.UNSUPPORTED_MIXED_CURRENCY,
      message: expect.stringContaining('moneda del documento'),
    });
  });

  it('rejects client-owned functional currency that differs from backend currency', () => {
    const cart = buildCart({
      products: [
        baseProduct({
          pricing: {
            price: 100,
            tax: 18,
            currency: 'USD',
          },
        }),
      ],
      extra: {
        documentCurrency: 'USD',
        functionalCurrency: 'USD',
      },
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.UNSUPPORTED_MIXED_CURRENCY,
      message: expect.stringContaining('moneda funcional del carrito'),
    });
  });

  it('accepts a single-currency invoice when backend functional currency matches', () => {
    const cart = buildCart({
      products: [
        baseProduct({
          pricing: {
            price: 100,
            tax: 18,
            currency: 'USD',
          },
        }),
      ],
      extra: {
        documentCurrency: 'USD',
        functionalCurrency: 'USD',
      },
    });

    expect(
      validateInvoiceCart(cart, { functionalCurrency: 'USD' }),
    ).toMatchObject({ isValid: true });
  });

  it('rejects insufficient payment', () => {
    const cart = buildCart({
      payment: 100,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.PAYMENT_INSUFFICIENT,
    });
  });

  it('accepts a payment with a matching credit note application', () => {
    const cart = buildCart({
      extra: {
        paymentMethod: [
          { method: 'cash', status: true, value: 186 },
          { method: 'creditNote', status: true, value: 50 },
        ],
        creditNotePayment: [
          {
            id: 'credit-note-1',
            amountUsed: 50,
            ncf: 'B0400000001',
          },
        ],
      },
    });

    expect(validateInvoiceCart(cart)).toMatchObject({ isValid: true });
  });

  it('rejects credit note payment methods without matching note detail', () => {
    const cart = buildCart({
      extra: {
        paymentMethod: [
          { method: 'cash', status: true, value: 186 },
          { method: 'creditNote', status: true, value: 50 },
        ],
      },
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.CREDIT_NOTE_PAYMENT_INCONSISTENT,
      message: expect.stringContaining('Pago con nota de credito'),
    });
  });

  it('rejects credit note details without an active payment method amount', () => {
    const cart = buildCart({
      extra: {
        creditNotePayment: [
          {
            id: 'credit-note-1',
            amountUsed: 50,
            ncf: 'B0400000001',
          },
        ],
      },
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.CREDIT_NOTE_PAYMENT_INCONSISTENT,
      message: expect.stringContaining('Pago con nota de credito'),
    });
  });

  it('rejects an incorrect change snapshot', () => {
    const cart = buildCart({
      payment: 300,
      change: 0,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      message: expect.stringContaining('Devuelta inconsistente'),
    });
  });

  it('rejects weighted products without a positive weight', () => {
    const cart = buildCart({
      products: [
        baseProduct({
          id: 'weighted-1',
          amountToBuy: 1,
          weightDetail: {
            isSoldByWeight: true,
            weight: 0,
          },
          pricing: {
            price: 30,
            tax: 18,
          },
        }),
      ],
      subtotal: 0,
      taxes: 0,
      total: 0,
      payment: 0,
      totalShoppingItems: 1,
    });

    expect(validateInvoiceCart(cart)).toEqual({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.INVALID_WEIGHT,
      message:
        'One or more products sold by weight have an invalid weight (must be > 0).',
      details: {},
    });
  });

  it('rejects weighted products with an unsupported weight unit', () => {
    const cart = buildCart({
      products: [
        baseProduct({
          id: 'weighted-1',
          amountToBuy: 1,
          weightDetail: {
            isSoldByWeight: true,
            weight: 2,
            weightUnit: 'unidad',
          },
          pricing: {
            price: 100,
            tax: 18,
          },
        }),
      ],
      subtotal: 200,
      taxes: 36,
      total: 236,
      payment: 236,
      totalShoppingItems: 1,
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.INVALID_WEIGHT_UNIT,
    });
  });

  it('rejects complex carts instead of skipping monetary enforcement', () => {
    const cart = buildCart({
      discount: { value: 10 },
      total: 200,
      payment: 200,
    });

    const result = validateInvoiceMonetaryConsistency(cart);
    expect(result).toMatchObject({
      isValid: false,
    });
    expect(result.skipped).toBeUndefined();
  });

  it('rejects raw monetary totals instead of accepting non-canonical snapshots', () => {
    const cart = {
      ...buildCart(),
      totalPurchaseWithoutTaxes: 200,
      totalTaxes: 36,
      totalPurchase: 236,
      payment: 236,
    };

    expect(validateInvoiceMonetaryConsistency(cart)).toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.MONETARY_SNAPSHOT_INCONSISTENT,
    });
  });
});

describe('invoiceValidation sale unit catalog checks', () => {
  it('accepts a valid sale unit from the catalog', async () => {
    await expect(
      validateInvoiceCartAgainstCatalog(saleUnitCart(), {
        businessId: 'business-1',
        loadProductCatalog: buildCatalogLoader({
          product: catalogProduct({
            saleUnits: [boxSaleUnit()],
          }),
          saleUnits: [boxSaleUnit()],
        }),
      }),
    ).resolves.toMatchObject({ isValid: true });
  });

  it('propagates backend functional currency to trusted catalog validation', async () => {
    const cart = buildCart({
      products: [
        baseProduct({
          pricing: {
            price: 100,
            tax: 18,
            currency: 'USD',
          },
        }),
      ],
      extra: {
        documentCurrency: 'USD',
        functionalCurrency: 'USD',
      },
    });

    await expect(
      validateInvoiceCartAgainstCatalog(cart, {
        businessId: 'business-1',
        functionalCurrency: 'USD',
        loadProductCatalog: buildCatalogLoader({
          product: catalogProduct({
            pricing: {
              price: 100,
              tax: 18,
              currency: 'USD',
            },
          }),
        }),
      }),
    ).resolves.toMatchObject({ isValid: true });
  });

  it('returns a trusted cart with catalog sale unit factor and baseQuantity', async () => {
    const result = await validateInvoiceCartAgainstCatalog(
      saleUnitCart(
        boxSaleUnit({
          conversionFactorToBase: 11.96,
        }),
      ),
      {
        businessId: 'business-1',
        loadProductCatalog: buildCatalogLoader({
          product: catalogProduct({
            saleUnits: [
              boxSaleUnit({
                conversionFactorToBase: undefined,
                quantity: 12,
              }),
            ],
          }),
        }),
      },
    );

    expect(result).toMatchObject({
      isValid: true,
      trustedCart: {
        products: [
          expect.objectContaining({
            baseQuantity: 24,
            selectedSaleUnit: expect.objectContaining({
              id: 'box-12',
              quantity: 12,
              conversionFactorToBase: 12,
            }),
          }),
        ],
      },
    });
  });

  it('rejects inactive products from the catalog', async () => {
    await expect(
      validateInvoiceCartAgainstCatalog(buildCart(), {
        businessId: 'business-1',
        loadProductCatalog: buildCatalogLoader({
          product: catalogProduct({ active: false }),
        }),
      }),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.PRODUCT_INACTIVE,
    });
  });

  it('rejects deleted products from the catalog', async () => {
    await expect(
      validateInvoiceCartAgainstCatalog(buildCart(), {
        businessId: 'business-1',
        loadProductCatalog: buildCatalogLoader({
          product: catalogProduct({ isDeleted: true }),
        }),
      }),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.PRODUCT_INACTIVE,
    });
  });

  it('rejects a missing sale unit', async () => {
    await expect(
      validateInvoiceCartAgainstCatalog(saleUnitCart(), {
        businessId: 'business-1',
        loadProductCatalog: buildCatalogLoader({
          product: catalogProduct({ saleUnits: [] }),
          saleUnits: [],
        }),
      }),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.SALE_UNIT_NOT_FOUND,
    });
  });

  it('rejects manipulated conversionFactorToBase', async () => {
    await expect(
      validateInvoiceCartAgainstCatalog(
        saleUnitCart(
          boxSaleUnit({
            conversionFactorToBase: 6,
          }),
        ),
        {
          businessId: 'business-1',
          loadProductCatalog: buildCatalogLoader({
            product: catalogProduct({
              saleUnits: [boxSaleUnit()],
            }),
          }),
        },
      ),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.SALE_UNIT_INCONSISTENT,
    });
  });

  it('rejects manipulated baseQuantity for base products', async () => {
    await expect(
      validateInvoiceCartAgainstCatalog(
        buildCart({
          products: [baseProduct({ baseQuantity: 1 })],
        }),
        {
          businessId: 'business-1',
          loadProductCatalog: buildCatalogLoader(),
        },
      ),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.BASE_QUANTITY_INCONSISTENT,
      details: {
        expected: 2,
        actual: 1,
      },
    });
  });

  it('rejects manipulated baseQuantity for sale unit products', async () => {
    await expect(
      validateInvoiceCartAgainstCatalog(
        saleUnitCart(boxSaleUnit(), {
          products: [
            baseProduct({
              amountToBuy: 2,
              baseQuantity: 2,
              selectedSaleUnit: boxSaleUnit(),
            }),
          ],
        }),
        {
          businessId: 'business-1',
          loadProductCatalog: buildCatalogLoader({
            product: catalogProduct({
              saleUnits: [boxSaleUnit()],
            }),
          }),
        },
      ),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.BASE_QUANTITY_INCONSISTENT,
      details: {
        expected: 24,
        actual: 2,
      },
    });
  });

  it('rejects manipulated baseQuantity for weighted products', async () => {
    const weightedProduct = baseProduct({
      amountToBuy: 1,
      baseQuantity: 1,
      weightDetail: {
        isSoldByWeight: true,
        weight: 2.5,
        weightUnit: 'lb',
      },
    });

    await expect(
      validateInvoiceCartAgainstCatalog(
        buildCart({
          products: [weightedProduct],
          subtotal: 250,
          taxes: 45,
          total: 295,
          totalShoppingItems: 1,
          payment: 295,
        }),
        {
          businessId: 'business-1',
          loadProductCatalog: buildCatalogLoader({
            product: catalogProduct({
              weightDetail: {
                isSoldByWeight: true,
                weightUnit: 'lb',
              },
            }),
          }),
        },
      ),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.BASE_QUANTITY_INCONSISTENT,
      details: {
        expected: 1.133981,
        actual: 1,
      },
    });
  });

  it('normalizes weighted baseQuantity to kilograms when a weight unit is present', async () => {
    const weightedProduct = baseProduct({
      amountToBuy: 1,
      baseQuantity: 0.907185,
      weightDetail: {
        isSoldByWeight: true,
        weight: 2,
        weightUnit: 'lb',
      },
    });

    await expect(
      validateInvoiceCartAgainstCatalog(
        buildCart({
          products: [weightedProduct],
          subtotal: 200,
          taxes: 36,
          total: 236,
          totalShoppingItems: 1,
          payment: 236,
        }),
        {
          businessId: 'business-1',
          loadProductCatalog: buildCatalogLoader({
            product: catalogProduct({
              weightDetail: {
                isSoldByWeight: true,
                weightUnit: 'lb',
              },
            }),
          }),
        },
      ),
    ).resolves.toMatchObject({
      isValid: true,
      trustedCart: {
        products: [
          expect.objectContaining({
            baseQuantity: 0.907185,
            weightDetail: expect.objectContaining({
              isSoldByWeight: true,
              weight: 2,
              weightUnit: 'lb',
            }),
          }),
        ],
      },
    });
  });

  it('rejects weighted payloads when the catalog product is not sold by weight', async () => {
    const weightedProduct = baseProduct({
      amountToBuy: 1,
      weightDetail: {
        isSoldByWeight: true,
        weight: 2,
        weightUnit: 'lb',
      },
    });

    await expect(
      validateInvoiceCartAgainstCatalog(
        buildCart({
          products: [weightedProduct],
          subtotal: 200,
          taxes: 36,
          total: 236,
          totalShoppingItems: 1,
          payment: 236,
        }),
        {
          businessId: 'business-1',
          loadProductCatalog: buildCatalogLoader(),
        },
      ),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.PRODUCT_WEIGHT_INCONSISTENT,
    });
  });

  it('rejects weighted catalog products without a supported catalog unit', async () => {
    const weightedProduct = baseProduct({
      amountToBuy: 1,
      weightDetail: {
        isSoldByWeight: true,
        weight: 2,
        weightUnit: 'lb',
      },
    });

    await expect(
      validateInvoiceCartAgainstCatalog(
        buildCart({
          products: [weightedProduct],
          subtotal: 200,
          taxes: 36,
          total: 236,
          totalShoppingItems: 1,
          payment: 236,
        }),
        {
          businessId: 'business-1',
          loadProductCatalog: buildCatalogLoader({
            product: catalogProduct({
              weightDetail: {
                isSoldByWeight: true,
              },
            }),
          }),
        },
      ),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.INVALID_WEIGHT_UNIT,
    });
  });

  it('rejects weighted payloads that change the catalog weight unit', async () => {
    const weightedProduct = baseProduct({
      amountToBuy: 1,
      baseQuantity: 2,
      weightDetail: {
        isSoldByWeight: true,
        weight: 2,
        weightUnit: 'kg',
      },
    });

    await expect(
      validateInvoiceCartAgainstCatalog(
        buildCart({
          products: [weightedProduct],
          subtotal: 200,
          taxes: 36,
          total: 236,
          totalShoppingItems: 1,
          payment: 236,
        }),
        {
          businessId: 'business-1',
          loadProductCatalog: buildCatalogLoader({
            product: catalogProduct({
              weightDetail: {
                isSoldByWeight: true,
                weightUnit: 'lb',
              },
            }),
          }),
        },
      ),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.PRODUCT_WEIGHT_INCONSISTENT,
    });
  });

  it('trusts the catalog weight unit when the payload omits it', async () => {
    const weightedProduct = baseProduct({
      amountToBuy: 1,
      baseQuantity: 0.907185,
      weightDetail: {
        isSoldByWeight: true,
        weight: 2,
      },
    });

    await expect(
      validateInvoiceCartAgainstCatalog(
        buildCart({
          products: [weightedProduct],
          subtotal: 200,
          taxes: 36,
          total: 236,
          totalShoppingItems: 1,
          payment: 236,
        }),
        {
          businessId: 'business-1',
          loadProductCatalog: buildCatalogLoader({
            product: catalogProduct({
              weightDetail: {
                isSoldByWeight: true,
                weightUnit: 'lb',
              },
            }),
          }),
        },
      ),
    ).resolves.toMatchObject({
      isValid: true,
      trustedCart: {
        products: [
          expect.objectContaining({
            baseQuantity: 0.907185,
            weightDetail: expect.objectContaining({
              isSoldByWeight: true,
              weight: 2,
              weightUnit: 'lb',
            }),
          }),
        ],
      },
    });
  });

  it('rejects manipulated sale unit price', async () => {
    const selectedSaleUnit = boxSaleUnit({
      pricing: {
        price: 120,
        tax: 18,
        currency: 'DOP',
      },
    });
    const cart = saleUnitCart(selectedSaleUnit, {
      subtotal: 240,
      taxes: 43.2,
      total: 283.2,
      payment: 283.2,
    });

    await expect(
      validateInvoiceCartAgainstCatalog(cart, {
        businessId: 'business-1',
        loadProductCatalog: buildCatalogLoader({
          product: catalogProduct({
            saleUnits: [boxSaleUnit()],
          }),
        }),
      }),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.SALE_UNIT_INCONSISTENT,
      message: expect.stringContaining('Precio inconsistente'),
    });
  });

  it('rejects manipulated sale unit ITBIS', async () => {
    const selectedSaleUnit = boxSaleUnit({
      pricing: {
        price: 150,
        tax: 16,
        currency: 'DOP',
      },
    });
    const cart = saleUnitCart(selectedSaleUnit, {
      taxes: 48,
      total: 348,
      payment: 348,
    });

    await expect(
      validateInvoiceCartAgainstCatalog(cart, {
        businessId: 'business-1',
        loadProductCatalog: buildCatalogLoader({
          product: catalogProduct({
            saleUnits: [boxSaleUnit()],
          }),
        }),
      }),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.SALE_UNIT_INCONSISTENT,
      message: expect.stringContaining('ITBIS inconsistente'),
    });
  });

  it('rejects inactive sale units', async () => {
    await expect(
      validateInvoiceCartAgainstCatalog(saleUnitCart(), {
        businessId: 'business-1',
        loadProductCatalog: buildCatalogLoader({
          product: catalogProduct({
            saleUnits: [boxSaleUnit({ active: false })],
          }),
        }),
      }),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.SALE_UNIT_INACTIVE,
    });
  });

  it('rejects sale units with inactive status', async () => {
    await expect(
      validateInvoiceCartAgainstCatalog(saleUnitCart(), {
        businessId: 'business-1',
        loadProductCatalog: buildCatalogLoader({
          product: catalogProduct({
            saleUnits: [boxSaleUnit({ status: 'inactive' })],
          }),
        }),
      }),
    ).resolves.toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.SALE_UNIT_INACTIVE,
    });
  });

  it('uses embedded saleUnits as canonical when a legacy subcollection is stale', async () => {
    const result = await validateInvoiceCartAgainstCatalog(saleUnitCart(), {
      businessId: 'business-1',
      loadProductCatalog: buildCatalogLoader({
        product: catalogProduct({
          saleUnits: [boxSaleUnit()],
        }),
        saleUnits: [
          boxSaleUnit({
            conversionFactorToBase: 10,
            pricing: {
              price: 125,
              tax: 18,
              currency: 'DOP',
            },
          }),
        ],
      }),
    });

    expect(result).toMatchObject({
      isValid: true,
      trustedCart: {
        products: [
          expect.objectContaining({
            baseQuantity: 24,
            selectedSaleUnit: expect.objectContaining({
              id: 'box-12',
              conversionFactorToBase: 12,
              pricing: expect.objectContaining({
                price: 150,
              }),
            }),
          }),
        ],
      },
    });
  });

  it('falls back to saleUnits subcollection when embedded saleUnits are empty', async () => {
    const result = await validateInvoiceCartAgainstCatalog(saleUnitCart(), {
      businessId: 'business-1',
      loadProductCatalog: buildCatalogLoader({
        product: catalogProduct({
          saleUnits: [],
        }),
        saleUnits: [boxSaleUnit()],
      }),
    });

    expect(result).toMatchObject({
      isValid: true,
      trustedCart: {
        products: [
          expect.objectContaining({
            baseQuantity: 24,
            selectedSaleUnit: expect.objectContaining({
              id: 'box-12',
              conversionFactorToBase: 12,
            }),
          }),
        ],
      },
    });
  });

  it('validates legacy saleUnit payloads instead of bypassing conversion checks', () => {
    const cart = buildCart({
      products: [
        baseProduct({
          saleUnit: {
            id: 'legacy-box',
            unitName: 'Caja',
            quantity: 0,
            pricing: {
              price: 150,
              tax: 18,
            },
          },
        }),
      ],
    });

    expect(validateInvoiceCart(cart)).toMatchObject({
      isValid: false,
      code: INVOICE_VALIDATION_CODES.INVALID_SALE_UNIT_CONVERSION,
    });
  });
});
