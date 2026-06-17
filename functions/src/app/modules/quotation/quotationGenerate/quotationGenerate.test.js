import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  buildContentMock,
  buildFooterMock,
  buildHeaderMock,
  createPdfKitDocumentMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => {
  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  return {
    assertUserAccessMock: vi.fn(),
    buildContentMock: vi.fn(() => [{ text: 'content' }]),
    buildFooterMock: vi.fn(() => ({ text: 'footer' })),
    buildHeaderMock: vi.fn(() => ({ text: 'header' })),
    createPdfKitDocumentMock: vi.fn(() => {
      const handlers = {};
      const pdfDoc = {
        on(event, handler) {
          handlers[event] = handler;
          return pdfDoc;
        },
        end() {
          handlers.data?.(Buffer.from('PDF'));
          handlers.end?.();
        },
      };
      return pdfDoc;
    }),
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: vi.fn(),
  };
});

vi.mock('fs', () => ({
  readFileSync: vi.fn(() => Buffer.from('font')),
}));

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: MockHttpsError,
    onCall: (handler) => handler,
  },
}));

vi.mock('pdfmake', () => ({
  default: class MockPdfPrinter {
    createPdfKitDocument(...args) {
      return createPdfKitDocumentMock(...args);
    }
  },
}));

vi.mock('./builders/content.js', () => ({
  buildContent: (...args) => buildContentMock(...args),
}));

vi.mock('./builders/footer.js', () => ({
  buildFooter: (...args) => buildFooterMock(...args),
}));

vi.mock('./builders/header.js', () => ({
  buildHeader: (...args) => buildHeaderMock(...args),
}));

vi.mock('./utils/documentHeightCalculator.js', () => ({
  calcFooterHeight: vi.fn(() => 60),
  calcHeaderHeight: vi.fn(() => 80),
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

import { quotationPdf } from './quotationGenerate.js';

const buildPayload = (overrides = {}) => ({
  businessId: 'business-1',
  business: {
    id: 'business-1',
    name: 'VentaMas Demo',
  },
  data: {
    id: 'quotation-1',
    products: [],
    totalPurchase: 0,
  },
  ...overrides,
});

const buildContext = (overrides = {}) => ({
  auth: { uid: 'user-1' },
  ...overrides,
});

describe('quotationPdf access boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue({
      role: 'cashier',
      source: 'canonical',
    });
  });

  it('requires a resolved callable actor before generating the PDF', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);
    const payload = buildPayload();

    await expect(quotationPdf(payload)).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith({
      data: payload,
      auth: null,
    });
    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(createPdfKitDocumentMock).not.toHaveBeenCalled();
  });

  it('requires a scoped businessId before checking access', async () => {
    await expect(
      quotationPdf(buildPayload({ businessId: '', business: {} })),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(createPdfKitDocumentMock).not.toHaveBeenCalled();
  });

  it('checks business access and returns the generated base64 PDF', async () => {
    const payload = buildPayload();
    const context = buildContext();

    await expect(quotationPdf(payload, context)).resolves.toBe('UERG');

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith({
      data: payload,
      auth: context.auth,
    });
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: ['invoice-operator'],
    });
    expect(buildHeaderMock).toHaveBeenCalled();
    expect(buildContentMock).toHaveBeenCalled();
    expect(buildFooterMock).toHaveBeenCalled();
    expect(createPdfKitDocumentMock).toHaveBeenCalledTimes(1);
  });

  it('allows session-token auth resolution from the adapted callable request', async () => {
    resolveCallableAuthUidMock.mockImplementation(async (request) => {
      if (request.data?.sessionToken === 'session-token-1') {
        return 'session-user-1';
      }
      return null;
    });
    const payload = buildPayload({ sessionToken: 'session-token-1' });
    const context = buildContext({
      auth: {
        uid: 'firebase-auth-user-1',
      },
    });

    await expect(quotationPdf(payload, context)).resolves.toBe('UERG');

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith({
      data: payload,
      auth: context.auth,
    });
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'session-user-1',
      businessId: 'business-1',
      allowedRoles: ['invoice-operator'],
    });
  });

  it('does not trust spoofed auth fields sent inside the callable data', async () => {
    resolveCallableAuthUidMock.mockImplementation(
      async (request) => request.auth?.uid ?? null,
    );
    const payload = buildPayload({
      auth: {
        uid: 'spoofed-user',
      },
    });
    const context = buildContext({
      auth: {
        uid: 'real-user',
      },
    });

    await expect(quotationPdf(payload, context)).resolves.toBe('UERG');

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith({
      data: payload,
      auth: context.auth,
    });
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'real-user',
      businessId: 'business-1',
      allowedRoles: ['invoice-operator'],
    });
  });
});
