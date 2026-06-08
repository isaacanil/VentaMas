import { httpsCallable } from 'firebase/functions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fbExportDgiiTxtReport } from './fbExportDgiiTxtReport';

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

vi.mock('@/firebase/Auth/fbAuthV2/sessionClient', () => ({
  getStoredSession: () => ({ sessionToken: 'session-token' }),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  functions: { app: 'test-functions' },
}));

describe('fbExportDgiiTxtReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia reportRunId para exportar la corrida DGII seleccionada', async () => {
    const callableMock = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        content: '607|101010101|202604|000000000001',
        fileName: 'DGII_F_607_101010101_202604.TXT',
        rowCount: 1,
      },
    });
    vi.mocked(httpsCallable).mockReturnValue(callableMock);

    const result = await fbExportDgiiTxtReport({
      businessId: 'business-1',
      periodKey: '2026-04',
      reportCode: 'DGII_607',
      reportRunId: 'report-run-607',
    });

    expect(httpsCallable).toHaveBeenCalledWith(
      { app: 'test-functions' },
      'exportDgiiTxtReport',
    );
    expect(callableMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      periodKey: '2026-04',
      reportCode: 'DGII_607',
      reportRunId: 'report-run-607',
      sessionToken: 'session-token',
    });
    expect(result).toEqual({
      ok: true,
      content: '607|101010101|202604|000000000001',
      fileName: 'DGII_F_607_101010101_202604.TXT',
      rowCount: 1,
    });
  });
});
