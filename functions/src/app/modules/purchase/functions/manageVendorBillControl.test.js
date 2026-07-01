import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  documentRefs,
  getCollectionRef,
  getDocRef,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
  runTransactionMock,
  toSnapshot,
  transactionGetMock,
  transactionSetMock,
  transactionSnapshots,
} = vi.hoisted(() => {
  const hoistedTransactionSnapshots = new Map();
  const hoistedDocumentRefs = new Map();

  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedAssertBusinessSubscriptionAccessMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();
  const hoistedTransactionGetMock = vi.fn();
  const hoistedTransactionSetMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const hoistedToSnapshot = (path, data) => ({
    exists: data != null,
    id: path.split('/').at(-1) ?? null,
    data: () => data,
  });

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      hoistedDocumentRefs.set(path, {
        path,
        get: vi.fn(async () =>
          hoistedToSnapshot(path, hoistedTransactionSnapshots.get(path)),
        ),
      });
    }

    return hoistedDocumentRefs.get(path);
  };
  const hoistedGetCollectionRef = (path) => ({
    path,
    where: (field, operator, value) => ({
      path: `${path}|where:${field}:${operator}:${value}`,
      queryField: field,
      queryOperator: operator,
      queryValue: value,
    }),
  });

  return {
    assertBusinessSubscriptionAccessMock:
      hoistedAssertBusinessSubscriptionAccessMock,
    assertUserAccessMock: hoistedAssertUserAccessMock,
    documentRefs: hoistedDocumentRefs,
    getCollectionRef: hoistedGetCollectionRef,
    getDocRef: hoistedGetDocRef,
    getPilotAccountingSettingsForBusinessMock:
      hoistedGetPilotAccountingSettingsForBusinessMock,
    isAccountingRolloutEnabledForBusinessMock:
      hoistedIsAccountingRolloutEnabledForBusinessMock,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: hoistedRunTransactionMock,
    toSnapshot: hoistedToSnapshot,
    transactionGetMock: hoistedTransactionGetMock,
    transactionSetMock: hoistedTransactionSetMock,
    transactionSnapshots: hoistedTransactionSnapshots,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-04-12T12:00:00.000Z'));
    }

    toMillis() {
      return this.millis;
    }
  },
  db: {
    collection: (path) => getCollectionRef(path),
    doc: (path) => getDocRef(path),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    ACCOUNTING_ADMIN: ['accounting-admin'],
    ACCOUNTING_WRITE: ['accounting-write'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock(
  '../../../versions/v2/billing/utils/subscriptionAccess.util.js',
  () => ({
    assertBusinessSubscriptionAccess: (...args) =>
      assertBusinessSubscriptionAccessMock(...args),
  }),
);

vi.mock(
  '../../../versions/v2/accounting/utils/accountingRollout.util.js',
  () => ({
    getPilotAccountingSettingsForBusiness: (...args) =>
      getPilotAccountingSettingsForBusinessMock(...args),
    isAccountingRolloutEnabledForBusiness: (...args) =>
      isAccountingRolloutEnabledForBusinessMock(...args),
  }),
);

vi.mock('nanoid', () => ({
  nanoid: () => 'control-event-fixed-id',
}));

import { manageVendorBillControl } from './manageVendorBillControl.js';

const purchasePath = 'businesses/business-1/purchases/purchase-1';
const vendorBillPath = 'businesses/business-1/vendorBills/purchase:purchase-1';
const otherVendorBillPath =
  'businesses/business-1/vendorBills/purchase:purchase-2';
const eventPath =
  'businesses/business-1/vendorBillControlEvents/control-event-fixed-id';
const paymentRunsByVendorBillQueryPath =
  'businesses/business-1/accountsPayablePaymentRuns|where:eligibleVendorBillIds:array-contains:purchase:purchase-1';
const vendorBillsBySupplierQueryPath =
  'businesses/business-1/vendorBills|where:supplierId:==:supplier-1';

const basePaymentState = {
  total: 200,
  paid: 0,
  balance: 200,
  paymentCount: 0,
};

const seedCompletedPayable = ({
  purchaseOverrides = {},
  vendorBillOverrides = {},
} = {}) => {
  transactionSnapshots.set(purchasePath, {
    id: 'purchase-1',
    providerId: 'supplier-1',
    numberId: 120,
    workflowStatus: 'completed',
    completedAt: '2026-04-10T12:00:00.000Z',
    vendorReference: 'SUP-INV-120',
    taxReceipt: {
      ncf: 'B0100000120',
      documentType: 'B01',
    },
    classification: {
      dgii606ExpenseType: '02',
    },
    monetary: {
      fiscalTotals: {
        taxAmount: 36,
      },
    },
    totalAmount: 200,
    paymentState: basePaymentState,
    paymentTerms: {
      expectedPaymentAt: '2026-04-30T12:00:00.000Z',
    },
    createdBy: 'buyer-1',
    ...purchaseOverrides,
  });
  transactionSnapshots.set(vendorBillPath, {
    id: 'purchase:purchase-1',
    status: 'approved',
    approvalStatus: 'approved',
    sourceDocumentType: 'purchase',
    sourceDocumentId: 'purchase-1',
    paymentState: basePaymentState,
    ...vendorBillOverrides,
  });
};

const findSetPayload = (path) =>
  transactionSetMock.mock.calls.find(([ref]) => ref.path === path)?.[1];

describe('manageVendorBillControl', () => {
  beforeEach(() => {
    transactionSnapshots.clear();
    documentRefs.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    transactionGetMock.mockImplementation(async (ref) => {
      const data = transactionSnapshots.get(ref.path);
      if (ref.queryField) {
        return {
          docs: (Array.isArray(data) ? data : []).map((entry, index) => {
            const entryId =
              entry && typeof entry === 'object' && !Array.isArray(entry)
                ? entry.id
                : null;
            return toSnapshot(
              `${ref.path}/${entryId || `doc-${index}`}`,
              entry,
            );
          }),
        };
      }
      if (Array.isArray(data)) {
        return {
          docs: data.map((entry, index) => {
            const entryId =
              entry && typeof entry === 'object' && !Array.isArray(entry)
                ? entry.id
                : null;
            return toSnapshot(
              `${ref.path}/${entryId || `doc-${index}`}`,
              entry,
            );
          }),
        };
      }

      return toSnapshot(ref.path, data);
    });
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: transactionGetMock,
        set: transactionSetMock,
      }),
    );
  });

  it('places a vendor bill hold with audit event and mirrored purchase controls', async () => {
    seedCompletedPayable();

    const result = await manageVendorBillControl({
      data: {
        businessId: 'business-1',
        vendorBillId: 'purchase:purchase-1',
        action: 'place_hold',
        reason: 'Pendiente de validar factura física',
        evidenceNote: 'Factura física retenida por compras',
        evidenceUrls: ['https://files.example/ap-120.pdf'],
      },
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: ['accounting-write'],
    });
    expect(assertBusinessSubscriptionAccessMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      action: 'write',
      operation: 'accountsPayable.payment',
    });

    const purchasePayload = findSetPayload(purchasePath);
    expect(purchasePayload.accountsPayable.paymentHold).toMatchObject({
      active: true,
      status: 'active',
      reason: null,
      createdBy: 'user-1',
      placedBy: 'user-1',
      evidenceUrls: [],
      evidenceNote: null,
    });
    expect(purchasePayload.accountsPayable.lastControlEventId).toBe(
      'control-event-fixed-id',
    );

    const vendorBillPayload = findSetPayload(vendorBillPath);
    expect(vendorBillPayload).toMatchObject({
      status: 'on_hold',
      approvalStatus: 'approved',
      paymentControl: {
        canRegisterPayment: false,
        label: 'Retenida',
        reason: 'Pendiente de validar factura física',
        status: 'on_hold',
        tone: 'warning',
      },
      paymentHold: {
        active: true,
        status: 'active',
        reason: 'Pendiente de validar factura física',
        evidenceNote: 'Factura física retenida por compras',
      },
      lastControlEventId: 'control-event-fixed-id',
    });

    expect(findSetPayload(eventPath)).toMatchObject({
      id: 'control-event-fixed-id',
      businessId: 'business-1',
      vendorBillId: 'purchase:purchase-1',
      purchaseId: 'purchase-1',
      action: 'place_hold',
      reason: 'Pendiente de validar factura física',
      evidenceNote: 'Factura física retenida por compras',
      nextControl: {
        status: 'on_hold',
        approvalStatus: 'approved',
      },
    });
    expect(result).toMatchObject({
      ok: true,
      action: 'place_hold',
      status: 'on_hold',
      approvalStatus: 'approved',
      controlEventId: 'control-event-fixed-id',
    });
  });

  it('prevents the purchase creator from approving the payable', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        createdBy: 'user-1',
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'approve',
          reason: 'Aprobación posterior a revisión',
          evidenceNote: 'Factura validada contra recepción',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: ['accounting-admin'],
    });
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('approves a pending payable with mirrored audit evidence', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'buyer-2',
          approvalRequestReason: 'Requiere revisión por monto',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
      },
    });

    const result = await manageVendorBillControl({
      data: {
        businessId: 'business-1',
        vendorBillId: 'purchase:purchase-1',
        action: 'approve',
        reason: 'Factura validada contra recepción',
        evidenceNote: 'Factura validada por contabilidad',
        evidenceUrls: ['https://files.example/ap-approval.pdf'],
      },
    });

    const purchasePayload = findSetPayload(purchasePath);
    expect(purchasePayload.accountsPayable).toMatchObject({
      approvalStatus: 'approved',
      approvedBy: 'user-1',
      approvalReason: null,
      approvalEvidenceNote: null,
      approvalEvidenceUrls: [],
      approvalRequestedAt: null,
      approvalRequestedBy: null,
      approvalRequestReason: null,
      approvalRequestEvidenceNote: null,
      approvalRequestEvidenceUrls: [],
      rejectionEvidenceNote: null,
      rejectionEvidenceUrls: [],
    });

    const vendorBillPayload = findSetPayload(vendorBillPath);
    expect(vendorBillPayload).toMatchObject({
      status: 'approved',
      approvalStatus: 'approved',
      approvedBy: 'user-1',
      approvalReason: 'Factura validada contra recepción',
      approvalEvidenceNote: 'Factura validada por contabilidad',
      approvalEvidenceUrls: ['https://files.example/ap-approval.pdf'],
      approvalRequestedAt: null,
      approvalRequestedBy: null,
      approvalRequestReason: null,
      approvalRequestEvidenceNote: null,
      approvalRequestEvidenceUrls: [],
      paymentControl: {
        canRegisterPayment: true,
        status: 'payable',
      },
    });
    expect(findSetPayload(eventPath)).toMatchObject({
      action: 'approve',
      evidenceNote: 'Factura validada por contabilidad',
      evidenceUrls: ['https://files.example/ap-approval.pdf'],
    });
    expect(result).toMatchObject({
      ok: true,
      action: 'approve',
      status: 'approved',
      approvalStatus: 'approved',
    });
  });

  it('blocks re-approving an already approved payable to preserve approval traceability', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'approved',
          approvedAt: '2026-04-11T10:00:00.000Z',
          approvedBy: 'approver-1',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'approved',
        approvedAt: '2026-04-11T10:00:00.000Z',
        approvedBy: 'approver-1',
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'approve',
          reason: 'Segundo intento de aprobación',
          evidenceNote: 'Soporte de segundo intento',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar debe estar pendiente de aprobación antes de aprobarse. Solicite un nuevo ciclo de aprobación para cambiar una decisión existente.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks approval when an active payable has the same supplier NCF', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'buyer-2',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
      },
    });
    transactionSnapshots.set(vendorBillsBySupplierQueryPath, [
      {
        id: 'purchase:purchase-2',
        status: 'approved',
        approvalStatus: 'approved',
        supplierId: 'supplier-1',
        vendorReference: 'SUP-INV-120',
        paymentState: {
          total: 200,
          paid: 0,
          balance: 200,
        },
        purchase: {
          providerId: 'supplier-1',
          vendorReference: 'SUP-INV-120',
          taxReceipt: {
            ncf: 'B0100000120',
          },
        },
      },
    ]);

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'approve',
          reason: 'Factura validada contra recepción',
          evidenceNote: 'Factura validada por contabilidad',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No se puede aprobar la CxP porque coincide con la CxP purchase:purchase-2 del mismo suplidor (NCF B0100000120). Revise duplicados antes de aprobar.',
    });

    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: vendorBillsBySupplierQueryPath,
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('allows approval when the matching supplier document is inactive', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'buyer-2',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
      },
    });
    transactionSnapshots.set(vendorBillsBySupplierQueryPath, [
      {
        id: 'purchase:purchase-2',
        status: 'voided',
        approvalStatus: 'voided',
        supplierId: 'supplier-1',
        vendorReference: 'SUP-INV-120',
        paymentState: {
          total: 200,
          paid: 0,
          balance: 200,
        },
        purchase: {
          providerId: 'supplier-1',
          vendorReference: 'SUP-INV-120',
          taxReceipt: {
            ncf: 'B0100000120',
          },
        },
      },
    ]);

    const result = await manageVendorBillControl({
      data: {
        businessId: 'business-1',
        vendorBillId: 'purchase:purchase-1',
        action: 'approve',
        reason: 'Factura validada contra recepción',
        evidenceNote: 'Factura validada por contabilidad',
      },
    });

    expect(result).toMatchObject({
      ok: true,
      action: 'approve',
      approvalStatus: 'approved',
    });
    expect(findSetPayload(vendorBillPath)).toMatchObject({
      approvalStatus: 'approved',
      paymentControl: {
        canRegisterPayment: true,
        status: 'payable',
      },
    });
  });

  it('blocks approval when the supplier invoice reference is missing', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'buyer-2',
        },
        createdBy: 'buyer-1',
        invoiceNumber: null,
        reference: null,
        vendorReference: null,
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
        vendorReference: null,
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'approve',
          reason: 'Factura validada contra recepción',
          evidenceNote: 'Factura validada por contabilidad',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No se puede aprobar la CxP porque falta factura o referencia del suplidor. Complete los datos fiscales/documentales antes de aprobar.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks approval when the payable has no due date', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'buyer-2',
        },
        createdBy: 'buyer-1',
        dates: {},
        paymentAt: null,
        paymentTerms: {},
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
        paymentTerms: {},
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'approve',
          reason: 'Factura validada contra recepción',
          evidenceNote: 'Factura validada por contabilidad',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No se puede aprobar la CxP porque falta fecha de vencimiento. Complete los datos fiscales/documentales antes de aprobar.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks approval for fiscal payables without NCF and DGII classification', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'buyer-2',
        },
        classification: {},
        createdBy: 'buyer-1',
        dgii606ExpenseType: null,
        proofOfPurchase: null,
        taxReceipt: {},
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'approve',
          reason: 'Factura validada contra recepción',
          evidenceNote: 'Factura validada por contabilidad',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No se puede aprobar la CxP porque falta NCF del comprobante fiscal, clasificación DGII 606. Complete los datos fiscales/documentales antes de aprobar.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('approves a non-fiscal payable without NCF or DGII classification', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'buyer-2',
        },
        classification: {},
        createdBy: 'buyer-1',
        documentType: null,
        dgii606ExpenseType: null,
        monetary: {},
        proofOfPurchase: null,
        taxReceipt: {},
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
        monetary: {},
      },
    });

    const result = await manageVendorBillControl({
      data: {
        businessId: 'business-1',
        vendorBillId: 'purchase:purchase-1',
        action: 'approve',
        reason: 'Factura validada contra recepción',
        evidenceNote: 'Factura no fiscal validada',
      },
    });

    expect(findSetPayload(vendorBillPath)).toMatchObject({
      approvalStatus: 'approved',
      paymentControl: {
        canRegisterPayment: true,
        status: 'payable',
      },
    });
    expect(result).toMatchObject({
      ok: true,
      action: 'approve',
      approvalStatus: 'approved',
    });
  });

  it('accepts evidence URLs as approval support without an evidence note', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'buyer-2',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
      },
    });

    await manageVendorBillControl({
      data: {
        businessId: 'business-1',
        vendorBillId: 'purchase:purchase-1',
        action: 'approve',
        reason: 'Factura validada contra recepción',
        evidenceUrls: ['https://files.example/ap-approval.pdf'],
      },
    });

    expect(findSetPayload(vendorBillPath)).toMatchObject({
      approvalEvidenceNote: null,
      approvalEvidenceUrls: ['https://files.example/ap-approval.pdf'],
      approvalStatus: 'approved',
    });
  });

  it('rejects a previously approved payable and clears approval decision fields', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'approved',
          approvedAt: '2026-04-11T10:00:00.000Z',
          approvedBy: 'approver-1',
          approvalReason: 'Aprobación previa',
          approvalEvidenceNote: 'Evidencia previa',
          approvalEvidenceUrls: ['https://files.example/old-approval.pdf'],
          approvalRequestedAt: '2026-04-11T09:00:00.000Z',
          approvalRequestedBy: 'requester-1',
          approvalRequestReason: 'Solicitud previa',
          approvalRequestEvidenceNote: 'Soporte previo',
          approvalRequestEvidenceUrls: ['https://files.example/request.pdf'],
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'approved',
      },
    });

    const result = await manageVendorBillControl({
      data: {
        businessId: 'business-1',
        vendorBillId: 'purchase:purchase-1',
        action: 'reject',
        reason: 'Factura no coincide con recepción',
        evidenceNote: 'Diferencia documentada en recepción',
        evidenceUrls: ['https://files.example/rejection.pdf'],
      },
    });

    const purchasePayload = findSetPayload(purchasePath);
    expect(purchasePayload.accountsPayable).toMatchObject({
      approvalStatus: 'rejected',
      approvedAt: null,
      approvedBy: null,
      approvalReason: null,
      approvalEvidenceNote: null,
      approvalEvidenceUrls: [],
      approvalRequestedAt: null,
      approvalRequestedBy: null,
      approvalRequestReason: null,
      approvalRequestEvidenceNote: null,
      approvalRequestEvidenceUrls: [],
      rejectedBy: 'user-1',
      rejectionReason: null,
      rejectionEvidenceNote: null,
      rejectionEvidenceUrls: [],
    });

    const vendorBillPayload = findSetPayload(vendorBillPath);
    expect(vendorBillPayload).toMatchObject({
      approvalStatus: 'rejected',
      approvedAt: null,
      approvedBy: null,
      approvalReason: null,
      approvalEvidenceNote: null,
      approvalEvidenceUrls: [],
      approvalRequestedAt: null,
      approvalRequestedBy: null,
      approvalRequestReason: null,
      approvalRequestEvidenceNote: null,
      approvalRequestEvidenceUrls: [],
      rejectedBy: 'user-1',
      rejectionReason: 'Factura no coincide con recepción',
      paymentControl: {
        canRegisterPayment: false,
        status: 'pending_approval',
      },
    });
    expect(result).toMatchObject({
      ok: true,
      action: 'reject',
      approvalStatus: 'rejected',
    });
  });

  it('reopens approval review without carrying stale decision evidence', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'rejected',
          approvedAt: '2026-04-11T10:00:00.000Z',
          approvedBy: 'approver-1',
          approvalReason: 'Aprobación previa',
          approvalEvidenceNote: 'Evidencia previa',
          approvalEvidenceUrls: ['https://files.example/old-approval.pdf'],
          rejectedAt: '2026-04-11T11:00:00.000Z',
          rejectedBy: 'reviewer-1',
          rejectionReason: 'Rechazo previo',
          rejectionEvidenceNote: 'Diferencia previa',
          rejectionEvidenceUrls: ['https://files.example/old-rejection.pdf'],
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'rejected',
      },
    });

    const result = await manageVendorBillControl({
      data: {
        businessId: 'business-1',
        vendorBillId: 'purchase:purchase-1',
        action: 'request_approval',
        reason: 'Factura corregida por suplidor',
        evidenceNote: 'Factura corregida adjunta',
        evidenceUrls: ['https://files.example/corrected-invoice.pdf'],
      },
    });

    const purchasePayload = findSetPayload(purchasePath);
    expect(purchasePayload.accountsPayable).toMatchObject({
      approvalStatus: 'pending_approval',
      approvalRequestedBy: 'user-1',
      approvalRequestReason: null,
      approvedAt: null,
      approvedBy: null,
      approvalReason: null,
      approvalEvidenceNote: null,
      approvalEvidenceUrls: [],
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      rejectionEvidenceNote: null,
      rejectionEvidenceUrls: [],
    });

    const vendorBillPayload = findSetPayload(vendorBillPath);
    expect(vendorBillPayload).toMatchObject({
      approvalStatus: 'pending_approval',
      approvalRequestedBy: 'user-1',
      approvalRequestReason: 'Factura corregida por suplidor',
      approvalRequestEvidenceNote: 'Factura corregida adjunta',
      approvalRequestEvidenceUrls: ['https://files.example/corrected-invoice.pdf'],
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      paymentControl: {
        canRegisterPayment: false,
        status: 'pending_approval',
      },
    });
    expect(result).toMatchObject({
      ok: true,
      action: 'request_approval',
      approvalStatus: 'pending_approval',
    });
  });

  it('requires accounting admin role group for AP control decisions', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'buyer-2',
          paymentHold: {
            active: true,
            status: 'active',
            createdBy: 'buyer-3',
            reason: 'Documento fiscal pendiente',
          },
        },
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
        paymentHold: {
          active: true,
          status: 'active',
          createdBy: 'buyer-3',
          reason: 'Documento fiscal pendiente',
        },
      },
    });

    await manageVendorBillControl({
      data: {
        businessId: 'business-1',
        vendorBillId: 'purchase:purchase-1',
        action: 'release_hold',
        reason: 'Documento fiscal conciliado',
        evidenceNote: 'Factura fiscal archivada',
      },
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: ['accounting-admin'],
    });
    expect(
      findSetPayload(purchasePath).accountsPayable.paymentHold,
    ).toMatchObject({
      active: false,
      status: 'released',
      releasedBy: 'user-1',
      releaseReason: null,
      releaseEvidenceNote: null,
      releaseEvidenceUrls: [],
    });
    expect(findSetPayload(vendorBillPath).paymentHold).toMatchObject({
      active: false,
      status: 'released',
      releasedBy: 'user-1',
      releaseEvidenceNote: 'Factura fiscal archivada',
    });
  });

  it('prevents the approval requester from approving the same payable', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'user-1',
          approvalRequestReason: 'Requiere revisión por monto',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'approve',
          reason: 'Factura validada contra recepción',
          evidenceNote: 'Factura validada por contabilidad',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('prevents a vendor-bill-only approval requester from approving the same payable', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
        approvalRequestedBy: 'user-1',
        approvalRequestReason: 'Requiere revisión por monto',
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'approve',
          reason: 'Factura validada contra recepción',
          evidenceNote: 'Factura validada por contabilidad',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La decisión de aprobación debe realizarla un usuario distinto al que envió la CxP a aprobación.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('prevents the approval requester from rejecting the same payable', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'user-1',
          approvalRequestReason: 'Requiere revisión por monto',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'reject',
          reason: 'Factura no coincide con recepción',
          evidenceNote: 'Diferencia documentada en recepción',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('prevents overwriting an already pending approval requester', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'pending_approval',
          approvalRequestedBy: 'buyer-2',
          approvalRequestReason: 'Requiere revisión por monto',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'pending_approval',
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'request_approval',
          reason: 'Reenviar para aprobación',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'La cuenta por pagar ya está pendiente de aprobación.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects an explicit vendor bill id that no longer exists', async () => {
    seedCompletedPayable();
    transactionSnapshots.delete(vendorBillPath);

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'place_hold',
          reason: 'Factura fiscal pendiente de entrega',
          evidenceNote: 'Proveedor no entregó comprobante final',
        },
      }),
    ).rejects.toMatchObject({
      code: 'not-found',
      message: 'La cuenta por pagar no existe.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects control changes when purchaseId and vendorBillId point to different purchases', async () => {
    transactionSnapshots.set(otherVendorBillPath, {
      id: 'purchase:purchase-2',
      status: 'approved',
      approvalStatus: 'approved',
      sourceDocumentType: 'purchase',
      sourceDocumentId: 'purchase-2',
      paymentState: basePaymentState,
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          purchaseId: 'purchase-1',
          vendorBillId: 'purchase:purchase-2',
          action: 'approve',
          reason: 'Factura validada contra recepción',
          evidenceNote: 'Factura validada por contabilidad',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'La cuenta por pagar no corresponde a la compra indicada.',
    });

    expect(transactionGetMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: purchasePath }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('resolves an open dispute and returns the bill to partially paid status', async () => {
    const disputedControl = {
      active: true,
      status: 'open',
      reason: 'Diferencia de precio',
      createdBy: 'auditor-2',
      openedBy: 'auditor-2',
    };
    seedCompletedPayable({
      purchaseOverrides: {
        paymentState: {
          total: 200,
          paid: 50,
          balance: 150,
          paymentCount: 1,
        },
        accountsPayable: {
          approvalStatus: 'approved',
          dispute: disputedControl,
        },
      },
      vendorBillOverrides: {
        status: 'disputed',
        dispute: disputedControl,
      },
    });

    const result = await manageVendorBillControl({
      data: {
        businessId: 'business-1',
        vendorBillId: 'purchase:purchase-1',
        action: 'resolve_dispute',
        reason: 'Diferencia conciliada con suplidor',
        evidenceNote: 'Nota de crédito recibida NC-55',
      },
    });

    const purchasePayload = findSetPayload(purchasePath);
    expect(purchasePayload.accountsPayable.dispute).toMatchObject({
      active: false,
      status: 'resolved',
      resolvedBy: 'user-1',
      resolutionReason: null,
      resolutionEvidenceNote: null,
      resolutionEvidenceUrls: [],
    });

    const vendorBillPayload = findSetPayload(vendorBillPath);
    expect(vendorBillPayload).toMatchObject({
      status: 'partially_paid',
      approvalStatus: 'approved',
      paymentControl: {
        canRegisterPayment: true,
        label: 'Aprobada',
        reason: null,
        status: 'payable',
        tone: 'success',
      },
      dispute: {
        active: false,
        status: 'resolved',
        resolutionEvidenceNote: 'Nota de crédito recibida NC-55',
      },
    });
    expect(result).toMatchObject({
      ok: true,
      action: 'resolve_dispute',
      status: 'partially_paid',
    });
  });

  it('voids an unpaid vendor bill with audit evidence and terminal projection', async () => {
    const paymentHold = {
      active: true,
      status: 'active',
      reason: 'Factura física pendiente',
      createdBy: 'reviewer-1',
    };
    const dispute = {
      active: true,
      status: 'open',
      reason: 'Diferencia de monto',
      openedBy: 'reviewer-2',
    };
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'approved',
          approvedAt: '2026-04-11T10:00:00.000Z',
          approvedBy: 'approver-1',
          paymentHold,
          dispute,
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'approved',
        paymentHold,
        dispute,
      },
    });

    const result = await manageVendorBillControl({
      data: {
        businessId: 'business-1',
        vendorBillId: 'purchase:purchase-1',
        action: 'void',
        reason: 'Factura duplicada por suplidor',
        evidenceNote: 'Ticket AP-VOID-1',
        evidenceUrls: ['https://files.example/void.pdf'],
      },
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: ['accounting-admin'],
    });

    const purchasePayload = findSetPayload(purchasePath);
    expect(purchasePayload.accountsPayable).toMatchObject({
      approvalStatus: 'voided',
      status: 'voided',
      voidedBy: 'user-1',
      voidReason: null,
      voidEvidenceNote: null,
      voidEvidenceUrls: [],
      lastControlAction: 'void',
      lastControlEventId: 'control-event-fixed-id',
      paymentHold: {
        active: false,
        status: 'voided',
        voidedBy: 'user-1',
        voidReason: null,
      },
      dispute: {
        active: false,
        status: 'voided',
        voidedBy: 'user-1',
        voidReason: null,
      },
    });

    const vendorBillPayload = findSetPayload(vendorBillPath);
    expect(vendorBillPayload).toMatchObject({
      status: 'voided',
      approvalStatus: 'voided',
      voidedBy: 'user-1',
      voidReason: 'Factura duplicada por suplidor',
      voidEvidenceNote: 'Ticket AP-VOID-1',
      voidEvidenceUrls: ['https://files.example/void.pdf'],
      paymentControl: {
        canRegisterPayment: false,
        label: 'Cerrada',
        reason: null,
        status: 'closed',
        tone: 'neutral',
      },
      paymentHold: {
        active: false,
        status: 'voided',
      },
      dispute: {
        active: false,
        status: 'voided',
      },
    });
    expect(findSetPayload(eventPath)).toMatchObject({
      action: 'void',
      evidenceNote: 'Ticket AP-VOID-1',
      nextControl: {
        status: 'voided',
        approvalStatus: 'voided',
      },
    });
    expect(result).toMatchObject({
      ok: true,
      action: 'void',
      status: 'voided',
      approvalStatus: 'voided',
    });
  });

  it('prevents voiding a vendor bill that is included in an active payment run', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'approved',
          approvedAt: '2026-04-11T10:00:00.000Z',
          approvedBy: 'approver-1',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'approved',
      },
    });
    transactionSnapshots.set(paymentRunsByVendorBillQueryPath, [
      {
        id: 'payment-run-1',
        approvalStatus: 'approved',
        executionStatus: 'not_started',
        status: 'approved',
        eligibleVendorBillIds: ['purchase:purchase-1'],
      },
    ]);

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'void',
          reason: 'Factura duplicada por suplidor',
          evidenceNote: 'Ticket AP-VOID-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta por pagar está incluida en la corrida CxP payment-run-1. Cancele o regenere la corrida antes de anular la CxP.',
    });

    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: paymentRunsByVendorBillQueryPath,
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('allows voiding a vendor bill when related payment runs are terminal', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'approved',
          approvedAt: '2026-04-11T10:00:00.000Z',
          approvedBy: 'approver-1',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'approved',
      },
    });
    transactionSnapshots.set(paymentRunsByVendorBillQueryPath, [
      {
        id: 'payment-run-canceled',
        approvalStatus: 'canceled',
        executionStatus: 'canceled',
        status: 'canceled',
        eligibleVendorBillIds: ['purchase:purchase-1'],
      },
    ]);

    const result = await manageVendorBillControl({
      data: {
        businessId: 'business-1',
        vendorBillId: 'purchase:purchase-1',
        action: 'void',
        reason: 'Factura duplicada por suplidor',
        evidenceNote: 'Ticket AP-VOID-1',
      },
    });

    expect(result).toMatchObject({
      ok: true,
      action: 'void',
      status: 'voided',
      approvalStatus: 'voided',
    });
    expect(findSetPayload(vendorBillPath)).toMatchObject({
      status: 'voided',
      approvalStatus: 'voided',
    });
  });

  it('prevents voiding a vendor bill when the source accounting period is closed', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'approved',
          approvedAt: '2026-04-11T10:00:00.000Z',
          approvedBy: 'approver-1',
        },
        createdBy: 'buyer-1',
      },
      vendorBillOverrides: {
        approvalStatus: 'approved',
      },
    });
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      { closedAt: '2026-04-30T23:59:59.000Z' },
    );

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'void',
          reason: 'Factura duplicada por suplidor',
          evidenceNote: 'Ticket AP-VOID-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No puedes anular esta CxP con fecha de abril de 2026 porque ese periodo contable esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
    });

    expect(transactionGetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountingPeriodClosures/2026-04',
      }),
    );
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('prevents voiding a vendor bill when payment activity exists only in the bill projection', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'approved',
          approvedBy: 'approver-1',
        },
      },
      vendorBillOverrides: {
        paymentState: {
          total: 200,
          paid: 50,
          balance: 150,
          paymentCount: 1,
          lastPaymentId: 'payment-1',
        },
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'void',
          reason: 'Factura duplicada por suplidor',
          evidenceNote: 'Ticket AP-VOID-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'No se puede anular una CxP con pagos registrados. Anule primero los pagos asociados.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('prevents the purchase creator from voiding the payable', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'approved',
          approvedBy: 'approver-1',
        },
        createdBy: 'user-1',
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'void',
          reason: 'Factura duplicada por suplidor',
          evidenceNote: 'Ticket AP-VOID-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La anulación de CxP debe realizarla un usuario distinto al que originó la compra.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('prevents the approval actor from voiding the same payable', async () => {
    seedCompletedPayable({
      purchaseOverrides: {
        accountsPayable: {
          approvalStatus: 'approved',
          approvedBy: 'user-1',
        },
        createdBy: 'buyer-1',
      },
    });

    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'void',
          reason: 'Factura duplicada por suplidor',
          evidenceNote: 'Ticket AP-VOID-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La anulación de CxP debe realizarla un usuario distinto al que aprobó la cuenta por pagar.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('requires a meaningful reason for every control action', async () => {
    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'place_hold',
          reason: 'no',
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
    });

    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('requires evidence or a reference for sensitive control actions', async () => {
    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'open_dispute',
          reason: 'Diferencia con factura recibida',
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
    });

    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('requires evidence or a reference before approving a payable', async () => {
    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'approve',
          reason: 'Factura validada contra recepción',
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('requires meaningful evidence text when no evidence URL is provided', async () => {
    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'approve',
          reason: 'Factura validada contra recepción',
          evidenceNote: 'ok',
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message:
        'Debe indicar una evidencia o referencia para este control de CxP.',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('requires evidence or a reference before voiding a payable', async () => {
    await expect(
      manageVendorBillControl({
        data: {
          businessId: 'business-1',
          vendorBillId: 'purchase:purchase-1',
          action: 'void',
          reason: 'Factura duplicada por suplidor',
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(runTransactionMock).not.toHaveBeenCalled();
  });
});
