import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  businessDocGetMock,
  createTaxReportRunMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => {
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedBusinessDocGetMock = vi.fn();
  const hoistedCreateTaxReportRunMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    businessDocGetMock: hoistedBusinessDocGetMock,
    createTaxReportRunMock: hoistedCreateTaxReportRunMock,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_config, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => ({
      id: path.split('/').at(-1),
      path,
      get: (...args) => businessDocGetMock(path, ...args),
    }),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    AUDIT: ['audit-role'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../services/taxReportRun.service.js', () => ({
  createTaxReportRun: (...args) => createTaxReportRunMock(...args),
}));

import { runMonthlyComplianceReport } from './runMonthlyComplianceReport.js';

describe('runMonthlyComplianceReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    businessDocGetMock.mockImplementation(async (path) => {
      if (path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            business: {
              features: {
                fiscal: {
                  reportingEnabled: true,
                  monthlyComplianceEnabled: true,
                },
              },
            },
          }),
        };
      }

      return {
        exists: false,
        data: () => ({}),
      };
    });
    createTaxReportRunMock.mockResolvedValue({
      id: 'run-1',
      reportCode: 'DGII_607',
      periodKey: '2026-04',
      version: 1,
      status: 'needs_review',
      preview: {
        issueSummary: {
          total: 2,
          bySeverity: { error: 1, warning: 1 },
          bySource: { creditNotes: 2 },
          byCode: {
            'linked-invoice-out-of-period': 1,
            'linked-invoice-ncf-mismatch': 1,
          },
        },
      },
    });
  });

  it('crea una corrida mensual auditable cuando el piloto está habilitado', async () => {
    const result = await runMonthlyComplianceReport({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
        reportCode: 'DGII_607',
      },
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'user-1',
      businessId: 'business-1',
      allowedRoles: ['audit-role'],
    });
    expect(createTaxReportRunMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      periodKey: '2026-04',
      reportCode: 'DGII_607',
      authUid: 'user-1',
    });
    expect(result).toEqual({
      ok: true,
      pilotMode: true,
      reportRunId: 'run-1',
      reportCode: 'DGII_607',
      periodKey: '2026-04',
      version: 1,
      status: 'needs_review',
      issueSummary: {
        total: 2,
        bySeverity: { error: 1, warning: 1 },
        bySource: { creditNotes: 2 },
        byCode: {
          'linked-invoice-out-of-period': 1,
          'linked-invoice-ncf-mismatch': 1,
        },
      },
    });
  });

  it('rechaza cuando el piloto mensual no está habilitado para el negocio', async () => {
    businessDocGetMock.mockImplementation(async (path) => {
      if (path === 'businesses/business-1') {
        return {
          exists: true,
          data: () => ({
            business: {
              features: {
                fiscal: {
                  reportingEnabled: true,
                  monthlyComplianceEnabled: false,
                },
              },
            },
          }),
        };
      }

      return {
        exists: false,
        data: () => ({}),
      };
    });

    await expect(
      runMonthlyComplianceReport({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'El piloto de compliance mensual no está habilitado para este negocio.',
    });

    expect(createTaxReportRunMock).not.toHaveBeenCalled();
  });
});
