import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChartOfAccount } from '@/types/accounting';

const collectionMock = vi.hoisted(() => vi.fn());
const onSnapshotMock = vi.hoisted(() => vi.fn());
const dbMock = vi.hoisted(() => ({ name: 'db-mock' }));
const createAccountingPostingProfileConfigMock = vi.hoisted(() => vi.fn());
const disableAccountingPostingProfileConfigMock = vi.hoisted(() => vi.fn());
const updateAccountingPostingProfileConfigMock = vi.hoisted(() => vi.fn());

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

vi.mock('@/firebase/accounting/accountingConfiguration', () => ({
  createAccountingPostingProfileConfig: (...args: unknown[]) =>
    createAccountingPostingProfileConfigMock(...args),
  disableAccountingPostingProfileConfig: (...args: unknown[]) =>
    disableAccountingPostingProfileConfigMock(...args),
  updateAccountingPostingProfileConfig: (...args: unknown[]) =>
    updateAccountingPostingProfileConfigMock(...args),
}));

import { useAccountingPostingProfiles } from './useAccountingPostingProfiles';

type PostingProfilesTestSnapshot = {
  docs: Array<{
    data: () => Record<string, unknown>;
    id: string;
  }>;
};

type SnapshotHandler = (snapshot: PostingProfilesTestSnapshot) => void;

const buildChartOfAccount = (
  account: Partial<ChartOfAccount> & Pick<ChartOfAccount, 'id' | 'name'>,
): ChartOfAccount => ({
  id: account.id,
  businessId: account.businessId ?? 'business-1',
  code: account.code ?? '1100',
  name: account.name,
  type: account.type ?? 'asset',
  parentId: account.parentId ?? null,
  postingAllowed: account.postingAllowed ?? true,
  status: account.status ?? 'active',
  normalSide: account.normalSide ?? 'debit',
  currencyMode: account.currencyMode ?? 'functional',
  systemKey: account.systemKey ?? null,
  metadata: account.metadata ?? {},
});

const cashAccount = buildChartOfAccount({
  id: 'account-cash',
  name: 'Caja general',
  systemKey: 'cash',
});
const salesAccount = buildChartOfAccount({
  id: 'account-sales',
  code: '4100',
  name: 'Ventas',
  normalSide: 'credit',
  systemKey: 'sales',
  type: 'income',
});

const postingProfileSnapshot: PostingProfilesTestSnapshot = {
  docs: [
    {
      id: 'profile-1',
      data: () => ({
        eventType: 'invoice.committed',
        linesTemplate: [
          {
            accountId: 'account-cash',
            amountSource: 'document_total',
            id: 'line-1',
            side: 'debit',
          },
          {
            accountId: 'account-sales',
            amountSource: 'net_sales',
            id: 'line-2',
            side: 'credit',
          },
        ],
        moduleKey: 'sales',
        name: 'Venta al contado',
        priority: 20,
        status: 'active',
      }),
    },
  ],
};

const renderPostingProfilesHook = (initialProps: {
  businessId: string | null;
  chartOfAccounts: ChartOfAccount[];
  enabled: boolean;
}) =>
  renderHook(
    ({ businessId, chartOfAccounts, enabled }) =>
      useAccountingPostingProfiles({
        businessId,
        chartOfAccounts,
        enabled,
        userId: 'user-1',
      }),
    {
      initialProps,
    },
  );

describe('useAccountingPostingProfiles loading', () => {
  beforeEach(() => {
    collectionMock.mockReset();
    onSnapshotMock.mockReset();
    createAccountingPostingProfileConfigMock.mockReset();
    disableAccountingPostingProfileConfigMock.mockReset();
    updateAccountingPostingProfileConfigMock.mockReset();

    collectionMock.mockImplementation(
      (_db: unknown, ...segments: string[]) => ({
        path: segments.join('/'),
      }),
    );
  });

  it('derives loading and safe data from the active snapshot', async () => {
    const unsubscribe = vi.fn();
    let handleSnapshot: SnapshotHandler | null = null;

    onSnapshotMock.mockImplementation(
      (_profilesRef: unknown, onNext: SnapshotHandler) => {
        handleSnapshot = onNext;
        return unsubscribe;
      },
    );

    const { result, rerender } = renderPostingProfilesHook({
      businessId: null,
      chartOfAccounts: [cashAccount, salesAccount],
      enabled: true,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.postingProfiles).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(onSnapshotMock).not.toHaveBeenCalled();

    rerender({
      businessId: 'business-1',
      chartOfAccounts: [cashAccount, salesAccount],
      enabled: true,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.postingProfiles).toEqual([]);

    await waitFor(() => expect(onSnapshotMock).toHaveBeenCalledOnce());

    act(() => {
      handleSnapshot?.(postingProfileSnapshot);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.postingProfiles).toHaveLength(1);
    });
    expect(result.current.postingProfiles[0]).toMatchObject({
      businessId: 'business-1',
      id: 'profile-1',
      name: 'Venta al contado',
    });
    expect(result.current.postingProfiles[0].linesTemplate[0]).toMatchObject({
      accountCode: '1100',
      accountName: 'Caja general',
      accountSystemKey: 'cash',
    });

    rerender({
      businessId: null,
      chartOfAccounts: [cashAccount, salesAccount],
      enabled: true,
    });

    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(result.current.loading).toBe(false);
    expect(result.current.postingProfiles).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('recomputes profile account labels from chart accounts without resubscribing', async () => {
    let handleSnapshot: SnapshotHandler | null = null;

    onSnapshotMock.mockImplementation(
      (_profilesRef: unknown, onNext: SnapshotHandler) => {
        handleSnapshot = onNext;
        return vi.fn();
      },
    );

    const { result, rerender } = renderPostingProfilesHook({
      businessId: 'business-1',
      chartOfAccounts: [cashAccount, salesAccount],
      enabled: true,
    });

    await waitFor(() => expect(onSnapshotMock).toHaveBeenCalledOnce());

    act(() => {
      handleSnapshot?.(postingProfileSnapshot);
    });

    await waitFor(() => {
      expect(
        result.current.postingProfiles[0].linesTemplate[0].accountName,
      ).toBe('Caja general');
    });

    rerender({
      businessId: 'business-1',
      chartOfAccounts: [
        {
          ...cashAccount,
          name: 'Caja principal',
        },
        salesAccount,
      ],
      enabled: true,
    });

    expect(onSnapshotMock).toHaveBeenCalledOnce();
    expect(result.current.loading).toBe(false);
    expect(result.current.postingProfiles[0].linesTemplate[0]).toMatchObject({
      accountCode: '1100',
      accountName: 'Caja principal',
      accountSystemKey: 'cash',
    });
  });
});
