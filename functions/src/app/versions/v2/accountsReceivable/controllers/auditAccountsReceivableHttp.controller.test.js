import { beforeEach, describe, expect, it, vi } from 'vitest';

const { collectionSnapshots, documentSnapshots, getCollectionRef, getDocRef } =
  vi.hoisted(() => {
    const hoistedCollectionSnapshots = new Map();
    const hoistedDocumentSnapshots = new Map();

    const getByPath = (record, path) =>
      String(path)
        .split('.')
        .reduce((current, key) => current?.[key], record);

    const toDocSnapshot = (path, data, ref = null) => ({
      exists: data != null,
      id: path.split('/').at(-1) ?? null,
      ref,
      data: () => data,
      get: (field) => getByPath(data, field),
    });

    const buildQuery = (path, constraints = [], limitValue = null) => ({
      where: (field, op, value) =>
        buildQuery(path, [...constraints, { field, op, value }], limitValue),
      orderBy: () => buildQuery(path, constraints, limitValue),
      limit: (value) => buildQuery(path, constraints, value),
      get: vi.fn(async () => {
        const rows = hoistedCollectionSnapshots.get(path) || [];
        const filtered = rows.filter(({ data }) =>
          constraints.every(({ field, op, value }) => {
            const fieldValue = getByPath(data, field);
            if (op === '==') return fieldValue === value;
            if (op === '>') return Number(fieldValue) > Number(value);
            if (op === '>=') return Number(fieldValue) >= Number(value);
            return true;
          }),
        );
        const limited = limitValue ? filtered.slice(0, limitValue) : filtered;
        return {
          docs: limited.map(({ id, data }) => {
            const docPath = `${path}/${id}`;
            const ref = { id, path: docPath };
            return toDocSnapshot(docPath, data, ref);
          }),
          empty: limited.length === 0,
          size: limited.length,
        };
      }),
    });

    const hoistedGetCollectionRef = (path) => buildQuery(path);
    const hoistedGetDocRef = (path) => ({
      id: path.split('/').at(-1) ?? null,
      path,
      get: vi.fn(async () =>
        toDocSnapshot(path, hoistedDocumentSnapshots.get(path)),
      ),
    });

    return {
      collectionSnapshots: hoistedCollectionSnapshots,
      documentSnapshots: hoistedDocumentSnapshots,
      getCollectionRef: hoistedGetCollectionRef,
      getDocRef: hoistedGetDocRef,
    };
  });

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
    onRequest: (handler) => handler,
  },
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  Timestamp: {
    fromMillis: (value) => ({ toMillis: () => value }),
  },
  db: {
    collection: (path) => getCollectionRef(path),
    collectionGroup: (collectionId) =>
      getCollectionRef(`__group__/${collectionId}`),
    doc: (path) => getDocRef(path),
  },
}));

vi.mock('../../auth/services/httpAuth.service.js', () => ({
  HttpAuthError: class HttpAuthError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  },
  resolveHttpAuthUser: vi.fn(async () => ({ uid: 'user-1' })),
}));

vi.mock('../../auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    AUDIT: new Set(['admin']),
  },
  assertUserAccess: vi.fn(async () => ({ role: 'admin' })),
}));

vi.mock('../../billing/utils/subscriptionAccess.util.js', () => ({
  assertBusinessSubscriptionAccess: vi.fn(async () => true),
}));

vi.mock('../../http/httpCors.util.js', () => ({
  handleHttpCorsPreflightAndMethod: vi.fn(() => false),
}));

vi.mock('../utils/receivableInvoiceState.util.js', () => ({
  expectsAccountsReceivable: vi.fn(() => false),
  getReceivableMetadata: vi.fn(() => ({
    isAdded: false,
    totalInstallments: 0,
  })),
  hasAccountsReceivable: vi.fn(async () => false),
}));

import { auditAccountsReceivableHttp } from './auditAccountsReceivableHttp.controller.js';

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

describe('auditAccountsReceivableHttp', () => {
  beforeEach(() => {
    collectionSnapshots.clear();
    documentSnapshots.clear();
    vi.clearAllMocks();
  });

  it('reports non-postable electronic adjustment notes that still have financial effects', async () => {
    collectionSnapshots.set('businesses/business-1/debitNotes', [
      {
        id: 'debit-note-1',
        data: {
          status: 'issued',
          ncf: 'E330000000001',
          electronicTaxReceipt: { status: 'rejected' },
          accountsReceivableId: 'ar-1',
        },
      },
    ]);
    documentSnapshots.set('businesses/business-1/accountsReceivable/ar-1', {
      status: 'open',
      isActive: true,
      arBalance: 118,
      totalReceivable: 118,
    });
    documentSnapshots.set(
      'businesses/business-1/accountingEvents/customer_debit_note.issued__debit-note-1',
      { status: 'recorded' },
    );

    collectionSnapshots.set('businesses/business-1/creditNotes', [
      {
        id: 'credit-note-1',
        data: {
          status: 'issued',
          ncf: 'E340000000001',
          electronicTaxReceipt: { status: 'rejected' },
          availableAmount: 118,
          totalAmount: 118,
        },
      },
      {
        id: 'credit-note-accepted',
        data: {
          status: 'issued',
          ncf: 'E340000000002',
          electronicTaxReceipt: { status: 'accepted' },
          availableAmount: 118,
          totalAmount: 118,
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/creditNoteApplications', [
      {
        id: 'application-1',
        data: {
          status: 'active',
          creditNoteId: 'credit-note-1',
        },
      },
      {
        id: 'application-accepted',
        data: {
          status: 'active',
          creditNoteId: 'credit-note-accepted',
        },
      },
    ]);
    documentSnapshots.set(
      'businesses/business-1/accountingEvents/customer_credit_note.issued__credit-note-1',
      { status: 'recorded' },
    );

    const response = createResponse();
    await auditAccountsReceivableHttp(
      { body: { businessId: 'business-1', sampleLimit: 5 } },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(
      response.payload.indicators.adjustmentNoteFinancialEffects,
    ).toMatchObject({
      scanned: 3,
      sampleLimit: 5,
      issues: [
        expect.objectContaining({
          issueType: 'non_postable_debit_note_has_financial_effects',
          noteType: 'debitNote',
          noteId: 'debit-note-1',
          fiscalStatus: 'rejected',
          accountsReceivable: expect.objectContaining({
            arId: 'ar-1',
            balance: 118,
          }),
        }),
        expect.objectContaining({
          issueType: 'non_postable_credit_note_has_financial_effects',
          noteType: 'creditNote',
          noteId: 'credit-note-1',
          fiscalStatus: 'rejected',
          applications: 1,
        }),
      ],
    });
  });
});
