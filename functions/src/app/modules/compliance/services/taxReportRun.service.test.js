import { describe, expect, it, vi } from 'vitest';

import { createTaxReportRun } from './taxReportRun.service.js';

const createFirestoreMock = ({ existingVersion = null } = {}) => {
  const txGet = vi.fn(async () =>
    existingVersion == null
      ? { exists: false, data: () => ({}) }
      : { exists: true, data: () => ({ lastVersion: existingVersion }) },
  );
  const txSet = vi.fn();
  const runTransaction = vi.fn(async (callback) =>
    callback({
      get: txGet,
      set: txSet,
    }),
  );

  return {
    firestore: {
      doc: vi.fn((path) => ({
        id: path.split('/').at(-1),
        path,
      })),
      collection: vi.fn((path) => ({
        doc: vi.fn(() => ({
          id: 'run-1',
          path: `${path}/run-1`,
        })),
      })),
      runTransaction,
    },
    txGet,
    txSet,
    runTransaction,
  };
};

describe('taxReportRun.service', () => {
  it('crea una corrida auditable con versión inicial y snapshot fuente', async () => {
    const { firestore, txSet, txGet } = createFirestoreMock();
    const previewBuilder = vi.fn(async () => ({
      reportCode: 'DGII_607',
      jurisdictionId: 'DO-DGII',
      ok: false,
      issues: [
        {
          sourceId: 'creditNotes',
          index: 0,
          code: 'linked-invoice-not-found',
          severity: 'error',
        },
      ],
      issueSummary: {
        total: 1,
        bySeverity: { error: 1 },
        bySource: { creditNotes: 1 },
        byCode: { 'linked-invoice-not-found': 1 },
      },
      sourceSummaries: [{ sourceId: 'creditNotes', recordsScanned: 1 }],
      pendingGaps: [],
      sourceSnapshots: {
        creditNotes: { recordsLoaded: 1 },
      },
      sourceRecords: {
        creditNotes: [{ recordId: 'cn-1', sourcePath: 'businesses/b1/creditNotes/cn-1' }],
      },
    }));

    const result = await createTaxReportRun({
      businessId: 'business-1',
      periodKey: '2026-04',
      reportCode: 'DGII_607',
      authUid: 'user-1',
      firestore,
      fieldValue: {
        serverTimestamp: vi.fn(() => 'server-timestamp'),
      },
      previewBuilder,
    });

    expect(previewBuilder).toHaveBeenCalledWith({
      businessId: 'business-1',
      periodKey: '2026-04',
      reportCode: 'DGII_607',
      firestore,
    });
    expect(txGet).toHaveBeenCalledTimes(1);
    expect(txSet).toHaveBeenCalledTimes(2);
    expect(txSet).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/taxReportRunVersions/DGII_607_2026-04',
      }),
      expect.objectContaining({
        reportCode: 'DGII_607',
        periodKey: '2026-04',
        lastVersion: 1,
        updatedBy: 'user-1',
      }),
    );
    expect(txSet).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/taxReportRuns/run-1',
      }),
      expect.objectContaining({
        id: 'run-1',
        reportCode: 'DGII_607',
        periodKey: '2026-04',
        version: 1,
        status: 'needs_review',
        createdBy: 'user-1',
        jurisdictionId: 'DO-DGII',
        sourceSnapshot: {
          sourceSnapshots: {
            creditNotes: { recordsLoaded: 1 },
          },
          sourceRecords: {
            creditNotes: [
              {
                recordId: 'cn-1',
                sourcePath: 'businesses/b1/creditNotes/cn-1',
              },
            ],
          },
        },
        validationSummary: {
          ok: false,
          totalIssues: 1,
          issueSummary: {
            total: 1,
            bySeverity: { error: 1 },
            bySource: { creditNotes: 1 },
            byCode: { 'linked-invoice-not-found': 1 },
          },
          sourceSummaries: [{ sourceId: 'creditNotes', recordsScanned: 1 }],
          pendingGaps: [],
        },
        issues: [
          {
            sourceId: 'creditNotes',
            index: 0,
            code: 'linked-invoice-not-found',
            severity: 'error',
          },
        ],
        generatedArtifacts: [],
        submittedAt: null,
        acceptedAt: null,
        rejectionSummary: null,
        amendsReportRunId: null,
      }),
    );
    expect(result).toMatchObject({
      id: 'run-1',
      reportCode: 'DGII_607',
      periodKey: '2026-04',
      version: 1,
      status: 'needs_review',
    });
  });

  it('incrementa la versión cuando ya existe una corrida previa del período', async () => {
    const { firestore } = createFirestoreMock({ existingVersion: 2 });

    const result = await createTaxReportRun({
      businessId: 'business-1',
      periodKey: '2026-04',
      reportCode: 'DGII_607',
      authUid: 'user-1',
      firestore,
      fieldValue: {
        serverTimestamp: vi.fn(() => 'server-timestamp'),
      },
      previewBuilder: vi.fn(async () => ({
        reportCode: 'DGII_607',
        jurisdictionId: 'DO-DGII',
        ok: true,
        issues: [],
        issueSummary: { total: 0, bySeverity: {}, bySource: {}, byCode: {} },
        sourceSummaries: [],
        pendingGaps: [],
        sourceSnapshots: {},
        sourceRecords: {},
      })),
    });

    expect(result.version).toBe(3);
    expect(result.status).toBe('validated');
  });
});
