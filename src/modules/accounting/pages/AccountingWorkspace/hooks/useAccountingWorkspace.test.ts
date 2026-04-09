import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const collectionMock = vi.hoisted(() => vi.fn());
const onSnapshotMock = vi.hoisted(() => vi.fn());
const useSelectorMock = vi.hoisted(() => vi.fn());
const dbMock = vi.hoisted(() => ({ name: 'db-mock' }));
const currentConfigMock = vi.hoisted(() => ({
  config: {
    generalAccountingEnabled: true,
    functionalCurrency: 'DOP',
  },
  error: null,
  isAccountingRolloutBusiness: true,
  loading: false,
}));
const currentChartMock = vi.hoisted(() => ({
  chartOfAccounts: [],
  error: null,
  loading: false,
}));
const currentPostingProfilesMock = vi.hoisted(() => ({
  error: null,
  loading: false,
  postingProfiles: [],
}));
const messageMock = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
}));
const fbCreateManualJournalEntryMock = vi.hoisted(() => vi.fn());
const fbCloseAccountingPeriodMock = vi.hoisted(() => vi.fn());
const fbReverseJournalEntryMock = vi.hoisted(() => vi.fn());

vi.mock('react-redux', () => ({
  useSelector: (...args: unknown[]) => useSelectorMock(...args),
}));

vi.mock('antd', () => ({
  message: messageMock,
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: (value: Date) => value,
  },
  collection: (...args: unknown[]) => collectionMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

vi.mock('@/firebase/accounting/fbCreateManualJournalEntry', () => ({
  fbCreateManualJournalEntry: (...args: unknown[]) =>
    fbCreateManualJournalEntryMock(...args),
}));

vi.mock('@/firebase/accounting/fbCloseAccountingPeriod', () => ({
  fbCloseAccountingPeriod: (...args: unknown[]) =>
    fbCloseAccountingPeriodMock(...args),
}));

vi.mock('@/firebase/accounting/fbReverseJournalEntry', () => ({
  fbReverseJournalEntry: (...args: unknown[]) =>
    fbReverseJournalEntryMock(...args),
}));

vi.mock(
  '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingConfig',
  () => ({
    useAccountingConfig: () => currentConfigMock,
  }),
);

vi.mock(
  '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useChartOfAccounts',
  () => ({
    useChartOfAccounts: () => currentChartMock,
  }),
);

vi.mock(
  '@/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingPostingProfiles',
  () => ({
    useAccountingPostingProfiles: () => currentPostingProfilesMock,
  }),
);

import { useAccountingWorkspace } from './useAccountingWorkspace';

describe('useAccountingWorkspace loading', () => {
  beforeEach(() => {
    collectionMock.mockReset();
    messageMock.error.mockReset();
    messageMock.info.mockReset();
    messageMock.success.mockReset();
    fbCreateManualJournalEntryMock.mockReset();
    fbCloseAccountingPeriodMock.mockReset();
    fbReverseJournalEntryMock.mockReset();
    onSnapshotMock.mockReset();
    useSelectorMock.mockReset();

    collectionMock.mockImplementation(
      (_db: unknown, ...segments: string[]) => ({
        path: segments.join('/'),
      }),
    );
  });

  it('reactivates accounting snapshots loading when the active business changes', async () => {
    let currentUser = { businessID: 'business-1', uid: 'user-1' };
    const listeners = new Map<string, (snapshot: any) => void>();

    useSelectorMock.mockImplementation(() => currentUser);
    onSnapshotMock.mockImplementation(
      (
        ref: { path: string },
        onNext: (snapshot: any) => void,
      ) => {
        listeners.set(ref.path, onNext);
        return vi.fn();
      },
    );

    const { result, rerender, unmount } = renderHook(() => useAccountingWorkspace());

    expect(result.current.journalLoading).toBe(true);
    expect(result.current.periodLoading).toBe(true);

    act(() => {
      listeners.get('businesses/business-1/accountingEvents')?.({ docs: [] });
      listeners.get('businesses/business-1/journalEntries')?.({ docs: [] });
      listeners
        .get('businesses/business-1/accountingPeriodClosures')
        ?.({ docs: [] });
    });

    await waitFor(() => {
      expect(result.current.journalLoading).toBe(false);
      expect(result.current.periodLoading).toBe(false);
    });

    currentUser = { businessID: 'business-2', uid: 'user-1' };
    rerender();

    await waitFor(() => {
      expect(result.current.journalLoading).toBe(true);
      expect(result.current.periodLoading).toBe(true);
    });

    act(() => {
      listeners.get('businesses/business-2/accountingEvents')?.({ docs: [] });
      listeners.get('businesses/business-2/journalEntries')?.({ docs: [] });
      listeners
        .get('businesses/business-2/accountingPeriodClosures')
        ?.({ docs: [] });
    });

    await waitFor(() => {
      expect(result.current.journalLoading).toBe(false);
      expect(result.current.periodLoading).toBe(false);
    });

    unmount();
  });

  it('reverses a posted journal entry through the backend callable', async () => {
    useSelectorMock.mockImplementation(() => ({
      businessID: 'business-1',
      uid: 'user-1',
    }));
    onSnapshotMock.mockImplementation(
      (
        ref: { path: string },
        onNext: (snapshot: any) => void,
      ) => {
        if (ref.path === 'businesses/business-1/accountingEvents') {
          onNext({ docs: [] });
        }
        if (ref.path === 'businesses/business-1/journalEntries') {
          onNext({ docs: [] });
        }
        if (ref.path === 'businesses/business-1/accountingPeriodClosures') {
          onNext({ docs: [] });
        }
        return vi.fn();
      },
    );
    fbReverseJournalEntryMock.mockResolvedValue({
      ok: true,
      entryId: 'entry-1',
      reversalEntryId: 'reversal-1',
      reused: false,
    });

    const { result, unmount } = renderHook(() => useAccountingWorkspace());

    await waitFor(() => {
      expect(result.current.journalLoading).toBe(false);
    });

    await act(async () => {
      const response = await result.current.reversePostedEntry({
        id: 'entry-1',
        businessId: 'business-1',
        eventId: 'manual:entry-1',
        eventType: 'manual.entry.recorded',
        eventVersion: 1,
        status: 'posted',
        lines: [],
        totals: { debit: 100, credit: 100 },
      });
      expect(response).toBe(true);
    });

    expect(fbReverseJournalEntryMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      entryId: 'entry-1',
    });

    unmount();
  });

  it('closes an accounting period through the backend callable', async () => {
    useSelectorMock.mockImplementation(() => ({
      businessID: 'business-1',
      uid: 'user-1',
    }));
    onSnapshotMock.mockImplementation(
      (
        ref: { path: string },
        onNext: (snapshot: any) => void,
      ) => {
        if (ref.path === 'businesses/business-1/accountingEvents') {
          onNext({ docs: [] });
        }
        if (ref.path === 'businesses/business-1/journalEntries') {
          onNext({ docs: [] });
        }
        if (ref.path === 'businesses/business-1/accountingPeriodClosures') {
          onNext({ docs: [] });
        }
        return vi.fn();
      },
    );
    fbCloseAccountingPeriodMock.mockResolvedValue({
      ok: true,
      periodKey: '2026-04',
      reused: false,
    });

    const { result, unmount } = renderHook(() => useAccountingWorkspace());

    await waitFor(() => {
      expect(result.current.periodLoading).toBe(false);
    });

    await act(async () => {
      const response = await result.current.closePeriod('2026-04', 'Cierre mensual');
      expect(response).toBe(true);
    });

    expect(fbCloseAccountingPeriodMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      note: 'Cierre mensual',
      periodKey: '2026-04',
    });

    unmount();
  });
});
