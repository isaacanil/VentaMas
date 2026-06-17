import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchAccountReceivableAudit = vi.hoisted(() => vi.fn());

vi.mock('../services/accountReceivableAuditHttp', () => ({
  fetchAccountReceivableAudit,
}));

import { useAccountReceivableAuditIndicators } from './useAccountReceivableAuditIndicators';

describe('useAccountReceivableAuditIndicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1781654400000);
  });

  it('does not fetch when business id is missing', async () => {
    const { result } = renderHook(() =>
      useAccountReceivableAuditIndicators(null),
    );

    await act(async () => {
      await result.current.fetchAuditIndicators(10);
    });

    expect(fetchAccountReceivableAudit).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      adjustmentNoteFinancialEffects: null,
      error: null,
      generatedAt: null,
      lastUpdated: null,
      loading: false,
    });
  });

  it('loads adjustment note financial effects from the audit endpoint', async () => {
    fetchAccountReceivableAudit.mockResolvedValue({
      generatedAt: '2026-06-17T00:00:00.000Z',
      indicators: {
        adjustmentNoteFinancialEffects: {
          scanned: 2,
          sampleLimit: 5,
          issues: [
            {
              issueType: 'non_postable_credit_note_has_financial_effects',
              noteType: 'creditNote',
              noteId: 'credit-note-1',
            },
          ],
        },
      },
    });

    const { result } = renderHook(() =>
      useAccountReceivableAuditIndicators('business-1', { defaultLimit: 5 }),
    );

    await waitFor(() =>
      expect(result.current.adjustmentNoteFinancialEffects?.scanned).toBe(2),
    );

    expect(fetchAccountReceivableAudit).toHaveBeenCalledWith({
      businessId: 'business-1',
      sampleLimit: 5,
    });
    expect(result.current).toMatchObject({
      error: null,
      generatedAt: '2026-06-17T00:00:00.000Z',
      lastUpdated: 1781654400000,
      loading: false,
    });
  });

  it('normalizes permission errors to a friendly message', async () => {
    fetchAccountReceivableAudit.mockRejectedValue({
      code: 'permission-denied',
      status: 403,
    });

    const { result } = renderHook(() =>
      useAccountReceivableAuditIndicators('business-1'),
    );

    await waitFor(() =>
      expect(result.current.error).toBe(
        'No tienes permisos para ejecutar la auditoría de CxC.',
      ),
    );

    expect(result.current.adjustmentNoteFinancialEffects).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
