import { beforeEach, describe, expect, it, vi } from 'vitest';

const serverTimestampMock = vi.fn(() => 'SERVER_TIMESTAMP');

vi.mock('../../../../core/config/firebase.js', () => ({
  FieldValue: {
    serverTimestamp: (...args) => serverTimestampMock(...args),
  },
}));

import {
  INVOICE_TIMING_STAGES,
  buildInvoiceTimingPatch,
  buildInvoiceTimingSeed,
  hasInvoiceTimingTimestamp,
  markInvoiceTimingStage,
  normalizeInvoiceTimingStage,
  readInvoiceTimingTimestamp,
} from './invoiceTiming.service.js';

describe('invoiceTiming.service', () => {
  beforeEach(() => {
    serverTimestampMock.mockClear();
  });

  it('define el contrato de etapas medibles en orden de pipeline', () => {
    expect(INVOICE_TIMING_STAGES).toEqual([
      'created',
      'canonical_done',
      'inventory_done',
      'fiscal_done',
      'cash_count_done',
      'print_ready',
      'committed',
    ]);
  });

  it('normaliza etapas y rechaza nombres fuera del contrato', () => {
    expect(normalizeInvoiceTimingStage(' canonical_done ')).toBe(
      'canonical_done',
    );
    expect(() => normalizeInvoiceTimingStage('canonical')).toThrow(
      'invoiceTiming stage no soportado: canonical',
    );
  });

  it('construye un patch de update con timestamp y metadata compacta', () => {
    const patch = buildInvoiceTimingPatch({
      stage: 'canonical_done',
      at: 'CANONICAL_TS',
      metadata: {
        source: 'outbox',
        taskId: 'task-1',
        optional: undefined,
      },
    });

    expect(patch).toEqual({
      'invoiceTiming.version': 1,
      'invoiceTiming.timestamps.canonical_done': 'CANONICAL_TS',
      'invoiceTiming.updatedAt': 'SERVER_TIMESTAMP',
      'invoiceTiming.metadata.canonical_done': {
        source: 'outbox',
        taskId: 'task-1',
      },
    });
    expect(serverTimestampMock).toHaveBeenCalledTimes(1);
  });

  it('construye la semilla created para incluirla en el set inicial', () => {
    const seed = buildInvoiceTimingSeed({
      at: 'CREATED_TS',
      updatedAt: 'UPDATED_TS',
      metadata: {
        source: 'createInvoiceV2',
      },
    });

    expect(seed).toEqual({
      invoiceTiming: {
        version: 1,
        timestamps: {
          created: 'CREATED_TS',
        },
        updatedAt: 'UPDATED_TS',
        metadata: {
          created: {
            source: 'createInvoiceV2',
          },
        },
      },
    });
    expect(serverTimestampMock).not.toHaveBeenCalled();
  });

  it('lee timestamps desde data plano o snapshots', () => {
    const invoiceData = {
      invoiceTiming: {
        timestamps: {
          inventory_done: 'INVENTORY_TS',
        },
      },
    };
    const invoiceSnap = {
      data: () => invoiceData,
    };

    expect(readInvoiceTimingTimestamp(invoiceData, 'inventory_done')).toBe(
      'INVENTORY_TS',
    );
    expect(hasInvoiceTimingTimestamp(invoiceSnap, 'inventory_done')).toBe(true);
    expect(hasInvoiceTimingTimestamp(invoiceSnap, 'fiscal_done')).toBe(false);
  });

  it('omite la escritura si la etapa ya existe', async () => {
    const transaction = {
      update: vi.fn(),
    };

    await expect(
      markInvoiceTimingStage({
        invoiceRef: { path: 'businesses/business-1/invoicesV2/invoice-1' },
        transaction,
        invoice: {
          invoiceTiming: {
            timestamps: {
              cash_count_done: 'CASH_TS',
            },
          },
        },
        stage: 'cash_count_done',
      }),
    ).resolves.toEqual({
      status: 'skipped',
      reason: 'already_marked',
      stage: 'cash_count_done',
    });

    expect(transaction.update).not.toHaveBeenCalled();
    expect(serverTimestampMock).not.toHaveBeenCalled();
  });

  it('escribe una etapa faltante dentro de una transaction existente', async () => {
    const invoiceRef = {
      path: 'businesses/business-1/invoicesV2/invoice-1',
    };
    const transaction = {
      update: vi.fn(),
    };

    await expect(
      markInvoiceTimingStage({
        invoiceRef,
        transaction,
        invoice: {
          invoiceTiming: {
            timestamps: {
              created: 'CREATED_TS',
            },
          },
        },
        stage: 'print_ready',
        at: 'PRINT_READY_TS',
        updatedAt: 'UPDATED_TS',
        metadata: {
          source: 'print',
        },
      }),
    ).resolves.toEqual({
      status: 'written',
      stage: 'print_ready',
    });

    expect(transaction.update).toHaveBeenCalledWith(invoiceRef, {
      'invoiceTiming.version': 1,
      'invoiceTiming.timestamps.print_ready': 'PRINT_READY_TS',
      'invoiceTiming.updatedAt': 'UPDATED_TS',
      'invoiceTiming.metadata.print_ready': {
        source: 'print',
      },
    });
  });

  it('puede escribir directo con invoiceRef.update cuando ya se tiene data', async () => {
    const invoiceRef = {
      update: vi.fn(async () => undefined),
    };

    await expect(
      markInvoiceTimingStage({
        invoiceRef,
        invoice: {},
        stage: 'committed',
        at: 'COMMITTED_TS',
      }),
    ).resolves.toEqual({
      status: 'written',
      stage: 'committed',
    });

    expect(invoiceRef.update).toHaveBeenCalledWith({
      'invoiceTiming.version': 1,
      'invoiceTiming.timestamps.committed': 'COMMITTED_TS',
      'invoiceTiming.updatedAt': 'SERVER_TIMESTAMP',
    });
  });

  it('exige data actual para mantener idempotencia', async () => {
    await expect(
      markInvoiceTimingStage({
        invoiceRef: {
          update: vi.fn(),
        },
        stage: 'fiscal_done',
      }),
    ).rejects.toThrow(
      'invoiceTiming requiere el invoice actual para preservar idempotencia',
    );
  });
});
