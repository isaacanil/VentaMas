import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveCallableAuthUidMock = vi.hoisted(() => vi.fn());
const assertUserAccessMock = vi.hoisted(() => vi.fn());
const assertBusinessSubscriptionAccessMock = vi.hoisted(() => vi.fn());
const createPendingInvoiceMock = vi.hoisted(() => vi.fn());
const validateInvoiceCartMock = vi.hoisted(() => vi.fn());
const validateInvoiceCartAgainstCatalogMock = vi.hoisted(() => vi.fn());
const getOpenCashCountDocMock = vi.hoisted(() => vi.fn());
const checkOpenCashCountMock = vi.hoisted(() => vi.fn());
const stableHashMock = vi.hoisted(() => vi.fn());
const getPilotAccountingSettingsForBusinessMock = vi.hoisted(() => vi.fn());

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  },
  onCall: (handler) => handler,
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'trace-id',
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: vi.fn(() => ({
      get: vi.fn(),
    })),
    collection: vi.fn(() => ({
      get: vi.fn(async () => ({ docs: [] })),
    })),
  },
}));

vi.mock('../../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    INVOICE_OPERATOR: new Set(['owner', 'admin', 'cashier', 'dev']),
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../billing/config/limitOperations.config.js', () => ({
  LIMIT_OPERATION_KEYS: {
    INVOICE_CREATE: 'invoice:create',
  },
}));

vi.mock('../../billing/utils/subscriptionAccess.util.js', () => ({
  assertBusinessSubscriptionAccess: (...args) =>
    assertBusinessSubscriptionAccessMock(...args),
}));

vi.mock('../../../../modules/invoice/utils/invoiceValidation.js', () => ({
  validateInvoiceCart: (...args) => validateInvoiceCartMock(...args),
  validateInvoiceCartAgainstCatalog: (...args) =>
    validateInvoiceCartAgainstCatalogMock(...args),
}));

vi.mock('../services/orchestrator.service.js', () => ({
  createPendingInvoice: (...args) => createPendingInvoiceMock(...args),
}));

vi.mock('../../accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: (...args) =>
    getPilotAccountingSettingsForBusinessMock(...args),
}));

vi.mock('../../../../modules/cashCount/utils/cashCountQueries.js', () => ({
  default: {
    getOpenCashCountDoc: (...args) => getOpenCashCountDocMock(...args),
  },
  getOpenCashCountDoc: (...args) => getOpenCashCountDocMock(...args),
}));

vi.mock('../../../../modules/cashCount/utils/cashCountCheck.js', () => ({
  checkOpenCashCount: (...args) => checkOpenCashCountMock(...args),
}));

vi.mock('../utils/hash.util.js', () => ({
  stableHash: (...args) => stableHashMock(...args),
}));

import { createInvoiceV2 } from './createInvoice.controller.js';

describe('createInvoiceV2 auth boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue({ role: 'owner' });
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
    validateInvoiceCartMock.mockReturnValue({ isValid: true });
    validateInvoiceCartAgainstCatalogMock.mockResolvedValue({ isValid: true });
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      functionalCurrency: 'DOP',
    });
    getOpenCashCountDocMock.mockResolvedValue({
      id: 'cash-count-1',
      get: (field) => (field === 'cashCount.id' ? 'cash-count-1' : null),
    });
    checkOpenCashCountMock.mockResolvedValue(undefined);
    createPendingInvoiceMock.mockResolvedValue({
      invoiceId: 'invoice-1',
      alreadyExists: false,
    });
  });

  it('rejects payload user mismatch before creating a pending invoice', async () => {
    await expect(
      createInvoiceV2({
        data: {
          businessId: 'business-1',
          idempotencyKey: 'key-1',
          user: {
            uid: 'spoofed-user',
          },
          cart: {
            id: 'cart-1',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(createPendingInvoiceMock).not.toHaveBeenCalled();
  });

  it('uses the authenticated actor as the pending invoice user id', async () => {
    await expect(
      createInvoiceV2({
        data: {
          businessId: 'business-1',
          idempotencyKey: 'key-1',
          user: {
            uid: 'user-1',
          },
          cart: {
            id: 'cart-1',
          },
        },
      }),
    ).resolves.toEqual({
      status: 'pending',
      invoiceId: 'invoice-1',
      reused: false,
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: expect.any(Set),
    });
    expect(createPendingInvoiceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        userId: 'user-1',
      }),
    );
  });

  it('passes server-owned functional currency to cart validations', async () => {
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      functionalCurrency: 'USD',
    });

    await createInvoiceV2({
      data: {
        businessId: 'business-1',
        idempotencyKey: 'key-1',
        user: {
          uid: 'user-1',
        },
        cart: {
          id: 'cart-1',
          products: [{ id: 'product-1' }],
        },
      },
    });

    expect(getPilotAccountingSettingsForBusinessMock).toHaveBeenCalledWith(
      'business-1',
    );
    expect(validateInvoiceCartMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cart-1',
      }),
      { functionalCurrency: 'USD' },
    );
    expect(validateInvoiceCartAgainstCatalogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cart-1',
      }),
      expect.objectContaining({
        businessId: 'business-1',
        loadProductCatalog: expect.any(Function),
        functionalCurrency: 'USD',
      }),
    );
  });

  it('rejects invalid cart validation before cash count and pending invoice creation', async () => {
    validateInvoiceCartMock.mockReturnValue({
      isValid: false,
      message: 'Total inconsistente',
    });

    await expect(
      createInvoiceV2({
        data: {
          businessId: 'business-1',
          idempotencyKey: 'key-1',
          user: {
            uid: 'user-1',
          },
          cart: {
            id: 'cart-1',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('Total inconsistente'),
    });

    expect(validateInvoiceCartAgainstCatalogMock).not.toHaveBeenCalled();
    expect(getOpenCashCountDocMock).not.toHaveBeenCalled();
    expect(checkOpenCashCountMock).not.toHaveBeenCalled();
    expect(createPendingInvoiceMock).not.toHaveBeenCalled();
  });

  it('rejects catalog validation failures before creating a pending invoice', async () => {
    validateInvoiceCartAgainstCatalogMock.mockResolvedValue({
      isValid: false,
      code: 'SALE_UNIT_INCONSISTENT',
      message: 'SALE_UNIT_INCONSISTENT',
    });

    await expect(
      createInvoiceV2({
        data: {
          businessId: 'business-1',
          idempotencyKey: 'key-1',
          user: {
            uid: 'user-1',
          },
          cart: {
            id: 'cart-1',
            products: [{ id: 'product-1' }],
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('SALE_UNIT_INCONSISTENT'),
    });

    expect(validateInvoiceCartAgainstCatalogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cart-1',
      }),
      expect.objectContaining({
        businessId: 'business-1',
        loadProductCatalog: expect.any(Function),
      }),
    );
    expect(getOpenCashCountDocMock).not.toHaveBeenCalled();
    expect(createPendingInvoiceMock).not.toHaveBeenCalled();
  });

  it('creates the pending invoice with the trusted catalog cart', async () => {
    validateInvoiceCartAgainstCatalogMock.mockResolvedValue({
      isValid: true,
      trustedCart: {
        id: 'cart-1',
        products: [
          {
            id: 'product-1',
            amountToBuy: 2,
            baseQuantity: 24,
            selectedSaleUnit: {
              id: 'box-12',
              conversionFactorToBase: 12,
            },
          },
        ],
      },
    });

    await createInvoiceV2({
      data: {
        businessId: 'business-1',
        idempotencyKey: 'key-1',
        user: {
          uid: 'user-1',
        },
        cart: {
          id: 'cart-1',
          products: [
            {
              id: 'product-1',
              amountToBuy: 2,
              selectedSaleUnit: {
                id: 'box-12',
                conversionFactorToBase: 11.96,
              },
            },
          ],
        },
      },
    });

    expect(createPendingInvoiceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          cart: expect.objectContaining({
            products: [
              expect.objectContaining({
                baseQuantity: 24,
                selectedSaleUnit: expect.objectContaining({
                  conversionFactorToBase: 12,
                }),
              }),
            ],
          }),
        }),
      }),
    );
  });
});
