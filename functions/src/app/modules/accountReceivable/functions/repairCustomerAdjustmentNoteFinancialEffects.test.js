import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  collectionSnapshots,
  documentRefs,
  documentSnapshots,
  getCollectionRef,
  getDocRef,
  transactionSetCalls,
} = vi.hoisted(() => {
  const hoistedDocumentSnapshots = new Map();
  const hoistedDocumentRefs = new Map();
  const hoistedCollectionSnapshots = new Map();
  const hoistedTransactionSetCalls = [];

  const toDocSnapshot = (path, data) => ({
    exists: data != null,
    id: path.split('/').at(-1) ?? null,
    data: () => data,
  });

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      hoistedDocumentRefs.set(path, {
        path,
        get: vi.fn(async () =>
          toDocSnapshot(path, hoistedDocumentSnapshots.get(path)),
        ),
      });
    }

    return hoistedDocumentRefs.get(path);
  };

  const buildQuery = (path, constraints = [], limitValue = null) => ({
    where: (field, op, value) =>
      buildQuery(path, [...constraints, { field, op, value }], limitValue),
    orderBy: () => buildQuery(path, constraints, limitValue),
    limit: (value) => buildQuery(path, constraints, value),
    get: vi.fn(async () => {
      const rows = hoistedCollectionSnapshots.get(path) || [];
      const filtered = rows.filter(({ data }) =>
        constraints.every(({ field, op, value }) => {
          if (op !== '==') return true;
          return data?.[field] === value;
        }),
      );
      const limited = limitValue ? filtered.slice(0, limitValue) : filtered;
      return {
        docs: limited.map(({ id, data }) => ({
          id,
          data: () => data,
        })),
      };
    }),
  });

  const hoistedGetCollectionRef = (path) => buildQuery(path);

  return {
    collectionSnapshots: hoistedCollectionSnapshots,
    documentRefs: hoistedDocumentRefs,
    documentSnapshots: hoistedDocumentSnapshots,
    getCollectionRef: hoistedGetCollectionRef,
    getDocRef: hoistedGetDocRef,
    transactionSetCalls: hoistedTransactionSetCalls,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
  onCall: (_options, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  FieldValue: {
    delete: () => ({ __op: 'delete' }),
  },
  Timestamp: class MockTimestamp {
    constructor(seconds, nanoseconds = 0) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }

    static now() {
      return new MockTimestamp(1772544000, 0);
    }
  },
  db: {
    collection: (path) => getCollectionRef(path),
    doc: (path) => getDocRef(path),
    runTransaction: vi.fn(async (handler) =>
      handler({
        get: (target) => target.get(),
        set: (ref, payload, options) => {
          transactionSetCalls.push({ path: ref.path, payload, options });
        },
      }),
    ),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: vi.fn(async () => 'user-1'),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    FINANCIAL_DOCUMENT_VOID: new Set(['admin']),
  },
  assertUserAccess: vi.fn(async () => ({ role: 'admin' })),
}));

import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import {
  repairCustomerAdjustmentNoteFinancialEffects,
  repairRejectedAdjustmentNoteFinancialEffects,
} from './repairCustomerAdjustmentNoteFinancialEffects.js';

describe('repairCustomerAdjustmentNoteFinancialEffects', () => {
  beforeEach(() => {
    collectionSnapshots.clear();
    documentRefs.clear();
    documentSnapshots.clear();
    transactionSetCalls.length = 0;
    vi.clearAllMocks();
    resolveCallableAuthUid.mockResolvedValue('user-1');
    assertUserAccess.mockResolvedValue({ role: 'admin' });
  });

  it('reports rejected adjustment notes with safe financial effects in dry-run mode', async () => {
    documentSnapshots.set('businesses/business-1/debitNotes/debit-note-1', {
      status: 'issued',
      ncf: 'E330000000001',
      electronicTaxReceipt: { status: 'rejected' },
      accountsReceivableId: 'ar-1',
    });
    documentSnapshots.set('businesses/business-1/accountsReceivable/ar-1', {
      id: 'ar-1',
      debitNoteId: 'debit-note-1',
      arBalance: 118,
      totalReceivable: 118,
      paymentState: { balance: 118 },
    });
    documentSnapshots.set(
      'businesses/business-1/accountingEvents/customer_debit_note.issued__debit-note-1',
      { status: 'recorded' },
    );
    collectionSnapshots.set(
      'businesses/business-1/accountsReceivableInstallments',
      [
        {
          id: 'installment-1',
          data: { arId: 'ar-1', installmentBalance: 118 },
        },
      ],
    );
    collectionSnapshots.set(
      'businesses/business-1/accountsReceivablePayments',
      [],
    );
    collectionSnapshots.set(
      'businesses/business-1/accountsReceivableInstallmentPayments',
      [],
    );

    documentSnapshots.set('businesses/business-1/creditNotes/credit-note-1', {
      status: 'issued',
      ncf: 'E340000000001',
      electronicTaxReceipt: { status: 'rejected' },
      availableAmount: 118,
      totalAmount: 118,
    });
    documentSnapshots.set(
      'businesses/business-1/accountingEvents/customer_credit_note.issued__credit-note-1',
      { status: 'recorded' },
    );
    collectionSnapshots.set('businesses/business-1/creditNoteApplications', []);

    const result = await repairRejectedAdjustmentNoteFinancialEffects({
      businessId: 'business-1',
      noteIds: {
        debit: ['debit-note-1'],
        credit: ['credit-note-1'],
      },
      dryRun: true,
      authUid: 'user-1',
    });

    expect(result.counts).toEqual({ would_repair: 2 });
    expect(result.results.map((entry) => entry.kind).sort()).toEqual([
      'creditNote',
      'debitNote',
    ]);
    expect(transactionSetCalls).toHaveLength(0);
  });

  it('voids safe rejected adjustment note financial effects when dry-run is disabled', async () => {
    documentSnapshots.set('businesses/business-1/debitNotes/debit-note-1', {
      status: 'issued',
      ncf: 'E330000000001',
      electronicTaxReceipt: { status: 'rejected' },
      accountsReceivableId: 'ar-1',
    });
    documentSnapshots.set('businesses/business-1/accountsReceivable/ar-1', {
      id: 'ar-1',
      debitNoteId: 'debit-note-1',
      clientId: 'client-1',
      invoiceId: 'invoice-1',
      arBalance: 118,
      totalReceivable: 118,
      paymentState: { total: 118, paid: 0, balance: 118 },
    });
    documentSnapshots.set('businesses/business-1/clients/client-1', {
      client: { pendingBalance: 118 },
    });
    documentSnapshots.set('businesses/business-1/invoices/invoice-1', {
      id: 'invoice-1',
      receivableState: { arId: 'ar-1', balanceDue: 118 },
      data: { receivableState: { arId: 'ar-1', balanceDue: 118 } },
    });
    documentSnapshots.set(
      'businesses/business-1/accountingEvents/customer_debit_note.issued__debit-note-1',
      { status: 'recorded' },
    );
    collectionSnapshots.set(
      'businesses/business-1/accountsReceivableInstallments',
      [
        {
          id: 'installment-1',
          data: { arId: 'ar-1', installmentBalance: 118 },
        },
      ],
    );
    collectionSnapshots.set(
      'businesses/business-1/accountsReceivablePayments',
      [],
    );
    collectionSnapshots.set(
      'businesses/business-1/accountsReceivableInstallmentPayments',
      [],
    );

    documentSnapshots.set('businesses/business-1/creditNotes/credit-note-1', {
      status: 'issued',
      ncf: 'E340000000001',
      electronicTaxReceipt: { status: 'rejected' },
      availableAmount: 118,
      totalAmount: 118,
    });
    documentSnapshots.set(
      'businesses/business-1/accountingEvents/customer_credit_note.issued__credit-note-1',
      { status: 'recorded' },
    );
    collectionSnapshots.set('businesses/business-1/creditNoteApplications', []);

    const result = await repairRejectedAdjustmentNoteFinancialEffects({
      businessId: 'business-1',
      noteIds: {
        debit: ['debit-note-1'],
        credit: ['credit-note-1'],
      },
      dryRun: false,
      authUid: 'user-1',
    });

    expect(result.counts).toEqual({ repaired: 2 });
    expect(transactionSetCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'businesses/business-1/debitNotes/debit-note-1',
          payload: expect.objectContaining({
            status: 'electronic_failed',
            financialEffectsStatus: 'voided_rejected_fiscal',
          }),
        }),
        expect.objectContaining({
          path: 'businesses/business-1/accountsReceivable/ar-1',
          payload: expect.objectContaining({
            arBalance: 0,
            isActive: false,
            status: 'voided',
          }),
        }),
        expect.objectContaining({
          path: 'businesses/business-1/creditNotes/credit-note-1',
          payload: expect.objectContaining({
            status: 'electronic_failed',
            availableAmount: 0,
            financialEffectsStatus: 'voided_rejected_fiscal',
          }),
        }),
        expect.objectContaining({
          path: 'businesses/business-1/invoices/invoice-1',
          payload: expect.objectContaining({
            receivableState: { __op: 'delete' },
            'data.receivableState': { __op: 'delete' },
          }),
        }),
      ]),
    );
  });

  it('keeps the callable in dry-run mode by default and checks financial-void access', async () => {
    documentSnapshots.set('businesses/business-1/creditNotes/credit-note-1', {
      status: 'issued',
      ncf: 'E340000000001',
      electronicTaxReceipt: { status: 'rejected' },
      availableAmount: 118,
      totalAmount: 118,
    });
    collectionSnapshots.set('businesses/business-1/creditNoteApplications', []);

    const result = await repairCustomerAdjustmentNoteFinancialEffects({
      data: {
        businessId: 'business-1',
        noteIds: { credit: ['credit-note-1'] },
        type: 'credit',
      },
    });

    expect(result.dryRun).toBe(true);
    expect(result.counts).toEqual({ would_repair: 1 });
    expect(transactionSetCalls).toHaveLength(0);
    expect(assertUserAccess).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.FINANCIAL_DOCUMENT_VOID,
    });
  });

  it('rejects unauthenticated callable requests', async () => {
    resolveCallableAuthUid.mockResolvedValueOnce(null);

    await expect(
      repairCustomerAdjustmentNoteFinancialEffects({
        data: { businessId: 'business-1' },
      }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('propagates callable access failures before scanning documents', async () => {
    const accessError = new Error('permission denied');
    assertUserAccess.mockRejectedValueOnce(accessError);

    await expect(
      repairCustomerAdjustmentNoteFinancialEffects({
        data: { businessId: 'business-1' },
      }),
    ).rejects.toBe(accessError);
    expect(collectionSnapshots.size).toBe(0);
    expect(transactionSetCalls).toHaveLength(0);
  });

  it('returns manual review without writes when debit note receivables already have payments', async () => {
    documentSnapshots.set('businesses/business-1/debitNotes/debit-note-1', {
      status: 'issued',
      ncf: 'E330000000001',
      electronicTaxReceipt: { status: 'rejected' },
      accountsReceivableId: 'ar-1',
    });
    documentSnapshots.set('businesses/business-1/accountsReceivable/ar-1', {
      id: 'ar-1',
      debitNoteId: 'debit-note-1',
      arBalance: 118,
      totalReceivable: 118,
      paymentState: { balance: 118 },
    });
    collectionSnapshots.set(
      'businesses/business-1/accountsReceivablePayments',
      [{ id: 'payment-1', data: { arId: 'ar-1', amount: 10 } }],
    );
    collectionSnapshots.set(
      'businesses/business-1/accountsReceivableInstallmentPayments',
      [],
    );
    collectionSnapshots.set(
      'businesses/business-1/accountsReceivableInstallments',
      [],
    );

    const result = await repairRejectedAdjustmentNoteFinancialEffects({
      businessId: 'business-1',
      noteIds: { debit: ['debit-note-1'] },
      types: ['debit'],
      dryRun: false,
      authUid: 'user-1',
    });

    expect(result.counts).toEqual({ manual_review: 1 });
    expect(result.results[0].reasons).toContain('payments_exist');
    expect(transactionSetCalls).toHaveLength(0);
  });

  it('returns manual review without writes when credit notes already have applications', async () => {
    documentSnapshots.set('businesses/business-1/creditNotes/credit-note-1', {
      status: 'issued',
      ncf: 'E340000000001',
      electronicTaxReceipt: { status: 'rejected' },
      availableAmount: 118,
      totalAmount: 118,
    });
    collectionSnapshots.set('businesses/business-1/creditNoteApplications', [
      { id: 'application-1', data: { creditNoteId: 'credit-note-1' } },
    ]);

    const result = await repairRejectedAdjustmentNoteFinancialEffects({
      businessId: 'business-1',
      noteIds: { credit: ['credit-note-1'] },
      types: ['credit'],
      dryRun: false,
      authUid: 'user-1',
    });

    expect(result.counts).toEqual({ manual_review: 1 });
    expect(result.results[0].reasons).toContain('applications_exist');
    expect(transactionSetCalls).toHaveLength(0);
  });

  it('does not auto-repair ambiguous local electronic failures', async () => {
    documentSnapshots.set('businesses/business-1/debitNotes/debit-note-1', {
      status: 'issued',
      ncf: 'E330000000001',
      electronicTaxReceipt: { status: 'local_failed' },
      accountsReceivableId: 'ar-1',
    });

    const result = await repairRejectedAdjustmentNoteFinancialEffects({
      businessId: 'business-1',
      noteIds: { debit: ['debit-note-1'] },
      types: ['debit'],
      dryRun: false,
      authUid: 'user-1',
    });

    expect(result.counts).toEqual({ manual_review: 1 });
    expect(result.results[0].reasons).toEqual(['ambiguous_fiscal_failure']);
    expect(transactionSetCalls).toHaveLength(0);
  });

  it('caps explicit note ids per type to avoid large fan-out repairs', async () => {
    await expect(
      repairRejectedAdjustmentNoteFinancialEffects({
        businessId: 'business-1',
        noteIds: {
          debit: Array.from({ length: 201 }, (_, index) => `debit-${index}`),
        },
        types: ['debit'],
      }),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });
});
