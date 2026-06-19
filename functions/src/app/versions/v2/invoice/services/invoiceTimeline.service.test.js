import { beforeEach, describe, expect, it, vi } from 'vitest';

let docMock = vi.fn();
let runTransactionMock = vi.fn();
const serverTimestampMock = vi.fn(() => ({ __op: 'serverTimestamp' }));
const arrayUnionMock = vi.fn((...values) => ({
  __op: 'arrayUnion',
  values,
}));
const timestampNowMock = vi.fn(() => ({ __op: 'timestampNow' }));

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => docMock(...args),
    runTransaction: (...args) => runTransactionMock(...args),
  },
  FieldValue: {
    serverTimestamp: (...args) => serverTimestampMock(...args),
    arrayUnion: (...args) => arrayUnionMock(...args),
  },
  Timestamp: {
    now: (...args) => timestampNowMock(...args),
  },
}));

import {
  INVOICE_TIMELINE_SCHEMA_VERSION,
  buildInvoiceTimelineEvent,
  buildInvoiceTimelinePaths,
  buildLegacyStatusTimelinePatch,
  upsertInvoiceTimelineEventInTransaction,
  writeInvoiceTimelineEvent,
  writeInvoiceTimelineEventInTransaction,
} from './invoiceTimeline.service.js';

describe('invoiceTimeline.service', () => {
  beforeEach(() => {
    docMock = vi.fn();
    runTransactionMock = vi.fn();
    serverTimestampMock.mockClear();
    arrayUnionMock.mockClear();
    timestampNowMock.mockClear();
  });

  it('construye eventos compactos para la subcoleccion timeline', () => {
    const event = buildInvoiceTimelineEvent({
      businessId: ' business-1 ',
      invoiceId: ' invoice-1 ',
      eventId: ' event-1 ',
      status: ' committed ',
      at: 'EVENT_AT',
      source: ' finalize ',
      actorId: ' user-1 ',
      taskId: ' task-1 ',
      correlationId: ' corr-1 ',
      metadata: {
        reason: 'all_done',
        optional: undefined,
        nested: {
          kept: true,
          skipped: undefined,
        },
      },
      payload: {
        taskTypes: ['createCanonicalInvoice', undefined],
      },
      createdAt: 'CREATED_AT',
      updatedAt: 'UPDATED_AT',
    });

    expect(event).toEqual({
      id: 'event-1',
      eventId: 'event-1',
      businessId: 'business-1',
      invoiceId: 'invoice-1',
      type: 'status',
      status: 'committed',
      schemaVersion: INVOICE_TIMELINE_SCHEMA_VERSION,
      at: 'EVENT_AT',
      source: 'finalize',
      actorId: 'user-1',
      taskId: 'task-1',
      correlationId: 'corr-1',
      metadata: {
        reason: 'all_done',
        nested: {
          kept: true,
        },
      },
      payload: {
        taskTypes: ['createCanonicalInvoice'],
      },
      createdAt: 'CREATED_AT',
      updatedAt: 'UPDATED_AT',
    });
    expect(serverTimestampMock).not.toHaveBeenCalled();
    expect(timestampNowMock).not.toHaveBeenCalled();
  });

  it('usa Timestamp.now y serverTimestamp cuando no se inyectan tiempos', () => {
    expect(
      buildInvoiceTimelineEvent({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        eventId: 'event-1',
        type: 'outbox_task_done',
      }),
    ).toEqual(
      expect.objectContaining({
        type: 'outbox_task_done',
        at: { __op: 'timestampNow' },
        createdAt: { __op: 'serverTimestamp' },
        updatedAt: { __op: 'serverTimestamp' },
      }),
    );
    expect(timestampNowMock).toHaveBeenCalledTimes(1);
    expect(serverTimestampMock).toHaveBeenCalledTimes(2);
  });

  it('resuelve las rutas canonicas de invoice y timeline', () => {
    expect(
      buildInvoiceTimelinePaths({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        eventId: 'event-1',
      }),
    ).toEqual({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
      eventId: 'event-1',
      invoicePath: 'businesses/business-1/invoicesV2/invoice-1',
      timelineEventPath:
        'businesses/business-1/invoicesV2/invoice-1/timeline/event-1',
    });
  });

  it('construye un patch legacy statusTimeline solo cuando se pide', () => {
    const event = buildInvoiceTimelineEvent({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
      eventId: 'event-1',
      status: 'print_ready',
      at: 'EVENT_AT',
      createdAt: 'CREATED_AT',
      updatedAt: 'UPDATED_AT',
    });

    expect(
      buildLegacyStatusTimelinePatch({
        event,
        legacyStatusTimelineEntry: true,
        updatedAt: 'LEGACY_UPDATED_AT',
      }),
    ).toEqual({
      statusTimeline: {
        __op: 'arrayUnion',
        values: [
          {
            status: 'print_ready',
            at: 'EVENT_AT',
          },
        ],
      },
      updatedAt: 'LEGACY_UPDATED_AT',
    });
    expect(
      buildLegacyStatusTimelinePatch({
        event,
        legacyStatusTimelineEntry: null,
      }),
    ).toBeNull();
  });

  it('permite un entry legacy personalizado y compacto', () => {
    const event = buildInvoiceTimelineEvent({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
      eventId: 'event-1',
      status: 'non_blocking_failure',
      at: 'EVENT_AT',
      createdAt: 'CREATED_AT',
      updatedAt: 'UPDATED_AT',
    });

    const patch = buildLegacyStatusTimelinePatch({
      event,
      legacyStatusTimelineEntry: {
        status: 'committed',
        reviewRequired: true,
        taskTypes: ['attachToCashCount', undefined],
        empty: undefined,
      },
    });

    expect(patch).toEqual({
      statusTimeline: {
        __op: 'arrayUnion',
        values: [
          {
            status: 'committed',
            at: 'EVENT_AT',
            reviewRequired: true,
            taskTypes: ['attachToCashCount'],
          },
        ],
      },
      updatedAt: { __op: 'serverTimestamp' },
    });
  });

  it('escribe evento y statusTimeline legacy dentro de una transaccion existente', async () => {
    const invoiceRef = {
      path: 'businesses/business-1/invoicesV2/invoice-1',
    };
    const timelineEventRef = {
      path: 'businesses/business-1/invoicesV2/invoice-1/timeline/event-1',
    };
    const transaction = {
      get: vi.fn(async () => ({ exists: false })),
      set: vi.fn(),
      update: vi.fn(),
    };

    await expect(
      writeInvoiceTimelineEventInTransaction({
        transaction,
        invoiceRef,
        timelineEventRef,
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        eventId: 'event-1',
        status: 'committed',
        at: 'EVENT_AT',
        source: 'finalize',
        legacyStatusTimelineEntry: true,
        legacyUpdatedAt: 'LEGACY_UPDATED_AT',
        createdAt: 'CREATED_AT',
        updatedAt: 'UPDATED_AT',
      }),
    ).resolves.toEqual({
      status: 'written',
      eventId: 'event-1',
      path: 'businesses/business-1/invoicesV2/invoice-1/timeline/event-1',
      legacyStatusTimelinePatched: true,
    });

    expect(transaction.get).toHaveBeenCalledWith(timelineEventRef);
    expect(transaction.set).toHaveBeenCalledWith(
      timelineEventRef,
      expect.objectContaining({
        eventId: 'event-1',
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        type: 'status',
        status: 'committed',
        source: 'finalize',
      }),
    );
    expect(transaction.update).toHaveBeenCalledWith(invoiceRef, {
      statusTimeline: {
        __op: 'arrayUnion',
        values: [
          {
            status: 'committed',
            at: 'EVENT_AT',
          },
        ],
      },
      updatedAt: 'LEGACY_UPDATED_AT',
    });
  });

  it('omite escrituras cuando el eventId ya existe', async () => {
    const transaction = {
      get: vi.fn(async () => ({ exists: true })),
      set: vi.fn(),
      update: vi.fn(),
    };

    await expect(
      writeInvoiceTimelineEventInTransaction({
        transaction,
        invoiceRef: {},
        timelineEventRef: {
          path: 'businesses/business-1/invoicesV2/invoice-1/timeline/event-1',
        },
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        eventId: 'event-1',
        type: 'outbox_task_done',
      }),
    ).resolves.toEqual({
      status: 'skipped',
      reason: 'already_exists',
      eventId: 'event-1',
      path: 'businesses/business-1/invoicesV2/invoice-1/timeline/event-1',
    });
    expect(transaction.set).not.toHaveBeenCalled();
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it('permite upsert sin lectura para integrarse despues de writes existentes', () => {
    const timelineEventRef = {
      path: 'businesses/business-1/invoicesV2/invoice-1/timeline/event-1',
    };
    const transaction = {
      set: vi.fn(),
    };

    expect(
      upsertInvoiceTimelineEventInTransaction({
        transaction,
        timelineEventRef,
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        eventId: 'event-1',
        status: 'committed',
        at: 'EVENT_AT',
        source: 'finalize',
        createdAt: 'CREATED_AT',
        updatedAt: 'UPDATED_AT',
      }),
    ).toEqual({
      status: 'upserted',
      eventId: 'event-1',
      path: timelineEventRef.path,
    });

    expect(transaction.set).toHaveBeenCalledWith(
      timelineEventRef,
      expect.objectContaining({
        eventId: 'event-1',
        status: 'committed',
        source: 'finalize',
      }),
      { merge: true },
    );
  });

  it('abre una transaccion con las rutas esperadas cuando se usa el wrapper', async () => {
    const refs = {
      'businesses/business-1/invoicesV2/invoice-1': {
        path: 'businesses/business-1/invoicesV2/invoice-1',
      },
      'businesses/business-1/invoicesV2/invoice-1/timeline/event-1': {
        path: 'businesses/business-1/invoicesV2/invoice-1/timeline/event-1',
      },
    };
    const transaction = {
      get: vi.fn(async () => ({ exists: false })),
      set: vi.fn(),
      update: vi.fn(),
    };

    docMock = vi.fn((path) => refs[path]);
    runTransactionMock = vi.fn(async (callback) => callback(transaction));

    await expect(
      writeInvoiceTimelineEvent({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        eventId: 'event-1',
        type: 'outbox_task_done',
        at: 'EVENT_AT',
        createdAt: 'CREATED_AT',
        updatedAt: 'UPDATED_AT',
      }),
    ).resolves.toEqual({
      status: 'written',
      eventId: 'event-1',
      path: 'businesses/business-1/invoicesV2/invoice-1/timeline/event-1',
      legacyStatusTimelinePatched: false,
    });

    expect(docMock).toHaveBeenCalledWith(
      'businesses/business-1/invoicesV2/invoice-1',
    );
    expect(docMock).toHaveBeenCalledWith(
      'businesses/business-1/invoicesV2/invoice-1/timeline/event-1',
    );
    expect(runTransactionMock).toHaveBeenCalledTimes(1);
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it('rechaza datos sin id completo o sin type/status', () => {
    expect(() =>
      buildInvoiceTimelineEvent({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        eventId: '',
        status: 'committed',
      }),
    ).toThrow('businessId, invoiceId y eventId son requeridos');

    expect(() =>
      buildInvoiceTimelineEvent({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        eventId: 'event-1',
      }),
    ).toThrow('invoiceTimeline requiere type o status');
  });
});
