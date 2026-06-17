import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const docMock = vi.hoisted(() => vi.fn());
const onSnapshotMock = vi.hoisted(() => vi.fn());
const dbMock = vi.hoisted(() => ({ name: 'db-mock' }));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

import { useAccountingSettingsSnapshot } from './useAccountingSettingsSnapshot';

type AccountingSettingsTestSnapshot = {
  exists: () => boolean;
  data: () => Record<string, unknown>;
};

type SnapshotHandler = (snapshot: AccountingSettingsTestSnapshot) => void;

describe('useAccountingSettingsSnapshot', () => {
  beforeEach(() => {
    docMock.mockReset();
    onSnapshotMock.mockReset();
    docMock.mockReturnValue({
      path: 'businesses/business-1/settings/accounting',
    });
  });

  it('no abre listener cuando falta businessId o el hook esta deshabilitado', () => {
    const { result: missingBusinessResult } = renderHook(() =>
      useAccountingSettingsSnapshot('', true),
    );
    const { result: disabledResult } = renderHook(() =>
      useAccountingSettingsSnapshot('business-1', false),
    );

    expect(missingBusinessResult.current).toMatchObject({
      businessId: null,
      status: 'disabled',
      data: null,
    });
    expect(disabledResult.current).toMatchObject({
      businessId: 'business-1',
      status: 'disabled',
      data: null,
    });
    expect(docMock).not.toHaveBeenCalled();
    expect(onSnapshotMock).not.toHaveBeenCalled();
  });

  it('comparte una sola suscripcion por businessId entre multiples consumidores', async () => {
    const unsubscribe = vi.fn();
    let handleSnapshot: SnapshotHandler | null = null;

    onSnapshotMock.mockImplementation((_ref, onNext: SnapshotHandler) => {
      handleSnapshot = onNext;
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() => ({
      rollout: useAccountingSettingsSnapshot(' business-1 ', true),
      banking: useAccountingSettingsSnapshot('business-1', true),
    }));

    await waitFor(() => expect(onSnapshotMock).toHaveBeenCalledOnce());
    expect(docMock).toHaveBeenCalledWith(
      dbMock,
      'businesses',
      'business-1',
      'settings',
      'accounting',
    );
    expect(result.current.rollout.status).toBe('loading');
    expect(result.current.banking.status).toBe('loading');

    act(() => {
      handleSnapshot?.({
        exists: () => true,
        data: () => ({
          rolloutEnabled: true,
          bankAccountsEnabled: false,
        }),
      });
    });

    await waitFor(() =>
      expect(result.current.rollout).toMatchObject({
        businessId: 'business-1',
        status: 'ready',
        data: {
          rolloutEnabled: true,
          bankAccountsEnabled: false,
        },
      }),
    );
    expect(result.current.banking).toEqual(result.current.rollout);

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
