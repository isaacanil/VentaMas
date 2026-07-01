import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveHttpAuthUserMock = vi.hoisted(() => vi.fn());
const assertUserAccessMock = vi.hoisted(() => vi.fn());
const assertBusinessSubscriptionAccessMock = vi.hoisted(() => vi.fn());
const createPendingInvoiceMock = vi.hoisted(() => vi.fn());
const validateInvoiceCartMock = vi.hoisted(() => vi.fn());
const validateInvoiceCartAgainstCatalogMock = vi.hoisted(() => vi.fn());
const getOpenCashCountDocMock = vi.hoisted(() => vi.fn());
const checkOpenCashCountMock = vi.hoisted(() => vi.fn());
const handleHttpCorsPreflightAndMethodMock = vi.hoisted(() => vi.fn());
const getPilotAccountingSettingsForBusinessMock = vi.hoisted(() => vi.fn());

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
      }
    },
    onRequest: (handler) => handler,
  },
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
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

vi.mock('../utils/idempotency.util.js', () => ({
  resolveIdempotencyKey: () => 'key-1',
}));

vi.mock('../../auth/services/httpAuth.service.js', () => ({
  HttpAuthError: class HttpAuthError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  },
  resolveHttpAuthUser: (...args) => resolveHttpAuthUserMock(...args),
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

vi.mock('../../http/httpCors.util.js', () => ({
  handleHttpCorsPreflightAndMethod: (...args) =>
    handleHttpCorsPreflightAndMethodMock(...args),
}));

vi.mock('../../http/httpError.util.js', () => ({
  mapHttpsErrorToHttpStatus: () => 500,
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

import { createInvoiceV2Http } from './createInvoiceHttp.controller.js';

const createResponse = () => {
  const response = {
    status: vi.fn((statusCode) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: vi.fn((payload) => {
      response.payload = payload;
      return response;
    }),
  };

  return response;
};

describe('createInvoiceV2Http validation boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handleHttpCorsPreflightAndMethodMock.mockReturnValue(false);
    resolveHttpAuthUserMock.mockResolvedValue({ uid: 'user-1' });
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

  it('returns 412 on catalog validation failure before pending invoice creation', async () => {
    validateInvoiceCartAgainstCatalogMock.mockResolvedValue({
      isValid: false,
      code: 'SALE_UNIT_INCONSISTENT',
      message: 'SALE_UNIT_INCONSISTENT',
    });

    const response = createResponse();
    await createInvoiceV2Http(
      {
        headers: {},
        body: {
          businessId: 'business-1',
          user: {
            uid: 'user-1',
          },
          cart: {
            id: 'cart-1',
            products: [{ id: 'product-1' }],
          },
        },
      },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(412);
    expect(response.payload).toMatchObject({
      code: 'SALE_UNIT_INCONSISTENT',
      error: expect.stringContaining('SALE_UNIT_INCONSISTENT'),
    });
    expect(getOpenCashCountDocMock).not.toHaveBeenCalled();
    expect(checkOpenCashCountMock).not.toHaveBeenCalled();
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

    const response = createResponse();
    await createInvoiceV2Http(
      {
        headers: {},
        body: {
          businessId: 'business-1',
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
      },
      response,
    );

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

  it('passes server-owned functional currency to cart validations', async () => {
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      functionalCurrency: 'USD',
    });

    const response = createResponse();
    await createInvoiceV2Http(
      {
        headers: {},
        body: {
          businessId: 'business-1',
          user: {
            uid: 'user-1',
          },
          cart: {
            id: 'cart-1',
            products: [{ id: 'product-1' }],
          },
        },
      },
      response,
    );

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
});
