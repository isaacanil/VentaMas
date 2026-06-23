import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMocks = vi.hoisted(() => ({
  doc: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => ({ __op: 'serverTimestamp' })),
  arrayUnion: vi.fn((...values) => ({ __op: 'arrayUnion', values })),
  timestampNow: vi.fn(() => ({ __op: 'timestampNow' })),
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => firebaseMocks.doc(...args),
    runTransaction: (...args) => firebaseMocks.runTransaction(...args),
  },
  FieldValue: {
    serverTimestamp: (...args) => firebaseMocks.serverTimestamp(...args),
    arrayUnion: (...args) => firebaseMocks.arrayUnion(...args),
  },
  Timestamp: {
    now: (...args) => firebaseMocks.timestampNow(...args),
  },
}));

import {
  PRINT_READY_STATUSES,
  attemptMarkInvoicePrintReady,
  resolveInvoicePrintReadyDecision,
  summarizePrintReadyOutboxTasks,
} from './printReady.service.js';

const doneTask = (type, overrides = {}) => ({
  type,
  status: 'done',
  ...overrides,
});

describe('printReady.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marca print_ready cuando todos los prerequisitos existentes terminaron', () => {
    const invoice = {
      status: 'frontend_ready',
      snapshot: {
        fiscalMode: 'electronic_ecf',
        electronicTaxReceipt: {
          mode: 'required',
          status: 'accepted',
          documentType: 'E32',
          eNcf: 'E320000000001',
        },
      },
    };

    const decision = resolveInvoicePrintReadyDecision({
      invoice,
      outboxSummary: [
        doneTask('createCanonicalInvoice'),
        doneTask('updateInventory', {
          payload: {
            products: [
              {
                id: 'product-1',
                trackInventory: true,
                productStockId: 'stock-1',
              },
            ],
          },
        }),
        doneTask('issueElectronicTaxReceipt'),
        doneTask('setupAR'),
        doneTask('consumeCreditNotes'),
        doneTask('setupInsuranceAR'),
        doneTask('attachToCashCount'),
      ],
    });

    expect(decision).toMatchObject({
      canMarkPrintReady: true,
      targetStatus: PRINT_READY_STATUSES.READY,
      shouldWriteStatus: true,
      blockers: [],
      reviewItems: [],
      frontendReadyCompatible: true,
    });
  });

  it('mantiene compatibilidad con frontend_ready cuando no llega la tarea canonica', () => {
    const decision = resolveInvoicePrintReadyDecision({
      invoice: {
        status: 'frontend_ready',
        frontendReadyAt: { seconds: 1 },
      },
      outboxSummary: [],
    });

    expect(decision.canMarkPrintReady).toBe(true);
    expect(decision.targetStatus).toBe(PRINT_READY_STATUSES.READY);
    expect(decision.blockers).toEqual([]);
  });

  it('bloquea mientras la canonica o el inventario real estan pendientes', () => {
    const decision = resolveInvoicePrintReadyDecision({
      invoice: { status: 'committing' },
      outboxSummary: [
        { type: 'createCanonicalInvoice', status: 'pending' },
        {
          type: 'updateInventory',
          status: 'pending',
          payload: {
            products: [{ id: 'product-1', trackInventory: true }],
          },
        },
      ],
    });

    expect(decision.canMarkPrintReady).toBe(false);
    expect(decision.targetStatus).toBeNull();
    expect(decision.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'createCanonicalInvoice',
          code: 'canonical_invoice_not_ready',
        }),
        expect.objectContaining({
          type: 'updateInventory',
          code: 'inventory_not_ready',
        }),
      ]),
    );
  });

  it('no bloquea por updateInventory pendiente cuando la tarea no tiene inventario fisico', () => {
    const decision = resolveInvoicePrintReadyDecision({
      invoice: { status: 'frontend_ready' },
      outboxSummary: [
        doneTask('createCanonicalInvoice'),
        {
          type: 'updateInventory',
          status: 'pending',
          payload: {
            products: [{ id: 'service-1', trackInventory: false }],
          },
        },
      ],
    });

    expect(decision.canMarkPrintReady).toBe(true);
    expect(decision.blockers).toEqual([]);
  });

  it('degrada a print_ready_with_review si caja falla sin bloquear', () => {
    const decision = resolveInvoicePrintReadyDecision({
      invoice: { status: 'frontend_ready' },
      outboxSummary: [
        doneTask('createCanonicalInvoice'),
        { type: 'attachToCashCount', status: 'failed' },
      ],
    });

    expect(decision.canMarkPrintReady).toBe(true);
    expect(decision.targetStatus).toBe(PRINT_READY_STATUSES.READY_WITH_REVIEW);
    expect(decision.reviewItems).toEqual([
      expect.objectContaining({
        type: 'attachToCashCount',
        code: 'cash_count_requires_review',
      }),
    ]);
  });

  it('bloquea si caja aun esta pendiente', () => {
    const decision = resolveInvoicePrintReadyDecision({
      invoice: { status: 'frontend_ready' },
      outboxSummary: [
        doneTask('createCanonicalInvoice'),
        { type: 'attachToCashCount', status: 'pending' },
      ],
    });

    expect(decision.canMarkPrintReady).toBe(false);
    expect(decision.blockers).toEqual([
      expect.objectContaining({
        type: 'attachToCashCount',
        code: 'cash_count_pending',
      }),
    ]);
  });

  it('bloquea e-CF requerido rechazado y manda a revision el fallo local no requerido', () => {
    const requiredDecision = resolveInvoicePrintReadyDecision({
      invoice: {
        status: 'frontend_ready',
        snapshot: {
          fiscalMode: 'electronic_ecf',
          electronicTaxReceipt: {
            mode: 'required',
            status: 'rejected',
          },
        },
      },
      outboxSummary: [doneTask('createCanonicalInvoice')],
    });

    expect(requiredDecision.canMarkPrintReady).toBe(false);
    expect(requiredDecision.blockers).toEqual([
      expect.objectContaining({
        type: 'issueElectronicTaxReceipt',
        code: 'electronic_tax_receipt_failed',
        status: 'rejected',
      }),
    ]);

    const pilotDecision = resolveInvoicePrintReadyDecision({
      invoice: {
        status: 'frontend_ready',
        snapshot: {
          fiscalMode: 'electronic_ecf',
          electronicTaxReceipt: {
            mode: 'pilot',
            status: 'local_failed',
          },
        },
      },
      outboxSummary: [doneTask('createCanonicalInvoice')],
    });

    expect(pilotDecision.canMarkPrintReady).toBe(true);
    expect(pilotDecision.targetStatus).toBe(
      PRINT_READY_STATUSES.READY_WITH_REVIEW,
    );
    expect(pilotDecision.reviewItems).toEqual([
      expect.objectContaining({
        type: 'issueElectronicTaxReceipt',
        code: 'electronic_tax_receipt_requires_review',
      }),
    ]);
  });

  it('bloquea CxC, notas y seguro cuando existen y no estan listos', () => {
    const decision = resolveInvoicePrintReadyDecision({
      invoice: { status: 'frontend_ready' },
      outboxSummary: [
        doneTask('createCanonicalInvoice'),
        { type: 'setupAR', status: 'pending' },
        { type: 'consumeCreditNotes', status: 'failed' },
        { type: 'setupInsuranceAR', status: 'pending' },
      ],
    });

    expect(decision.canMarkPrintReady).toBe(false);
    expect(decision.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'accounts_receivable_not_ready' }),
        expect.objectContaining({ code: 'credit_notes_not_ready' }),
        expect.objectContaining({ code: 'insurance_ar_not_ready' }),
      ]),
    );
  });

  it('normaliza docs Firestore-like en resumen de outbox', () => {
    const summary = summarizePrintReadyOutboxTasks([
      {
        id: 'task-1',
        data: () => ({
          type: ' createCanonicalInvoice ',
          status: ' done ',
        }),
      },
      {
        id: 'task-2',
        data: () => ({
          type: '   ',
          status: 'done',
        }),
      },
    ]);

    expect(summary.taskTypes).toEqual(['createCanonicalInvoice']);
    expect(summary.byType.createCanonicalInvoice.done).toBe(1);
  });

  it('acepta el snapshot e-CF desde la factura canonica', () => {
    const decision = resolveInvoicePrintReadyDecision({
      invoice: {
        status: 'frontend_ready',
        electronicTaxReceipt: {
          mode: 'required',
          status: 'issued',
          eNcf: 'E320000000001',
        },
      },
      outboxSummary: [doneTask('createCanonicalInvoice')],
    });

    expect(decision.canMarkPrintReady).toBe(true);
    expect(decision.targetStatus).toBe(PRINT_READY_STATUSES.READY);
  });

  it('marca print_ready e idempotencia cuando la barrera se cumple', async () => {
    const invoiceRef = {
      path: 'businesses/business-1/invoicesV2/invoice-1',
      collection: vi.fn(() => ({ kind: 'outbox' })),
    };
    const idemRef = { path: 'businesses/business-1/idempotency/idem-1' };
    const tx = {
      get: vi.fn(async (ref) => {
        if (ref === invoiceRef) {
          return {
            exists: true,
            data: () => ({
              status: 'committing',
              idempotencyKey: 'idem-1',
            }),
          };
        }
        if (ref.kind === 'outbox') {
          return {
            docs: [
              {
                id: 'task-canon',
                data: () => ({
                  type: 'createCanonicalInvoice',
                  status: 'done',
                }),
              },
            ],
          };
        }
        throw new Error(`unexpected ref: ${ref.path || ref.kind}`);
      }),
      update: vi.fn(),
      set: vi.fn(),
    };
    firebaseMocks.doc.mockImplementation((path) => {
      if (path === 'businesses/business-1/invoicesV2/invoice-1') {
        return invoiceRef;
      }
      if (path === 'businesses/business-1/idempotency/idem-1') {
        return idemRef;
      }
      if (
        path ===
        'businesses/business-1/invoicesV2/invoice-1/timeline/print_ready__print_ready'
      ) {
        return { path };
      }
      throw new Error(`unexpected doc path: ${path}`);
    });
    firebaseMocks.runTransaction.mockImplementation(async (callback) =>
      callback(tx),
    );

    await expect(
      attemptMarkInvoicePrintReady({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
      }),
    ).resolves.toMatchObject({
      status: 'written',
      targetStatus: PRINT_READY_STATUSES.READY,
    });

    expect(tx.update).toHaveBeenCalledWith(
      invoiceRef,
      expect.objectContaining({
        status: PRINT_READY_STATUSES.READY,
        printReadyAt: { __op: 'serverTimestamp' },
      }),
    );
    expect(tx.set).toHaveBeenCalledWith(
      idemRef,
      expect.objectContaining({
        status: PRINT_READY_STATUSES.READY,
      }),
      { merge: true },
    );
    expect(tx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/invoicesV2/invoice-1/timeline/print_ready__print_ready',
      }),
      expect.objectContaining({
        status: PRINT_READY_STATUSES.READY,
        source: 'attemptMarkInvoicePrintReady',
      }),
      { merge: true },
    );
  });
});
