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

import { useFiscalMonthlyComplianceAvailability } from './useFiscalMonthlyComplianceAvailability';

describe('useFiscalMonthlyComplianceAvailability', () => {
  beforeEach(() => {
    docMock.mockReset();
    onSnapshotMock.mockReset();
    docMock.mockImplementation((_db: unknown, ...segments: string[]) => ({
      path: segments.join('/'),
    }));
  });

  it('resolves enabled when reporting and monthly compliance are active', async () => {
    let emitSnapshot: ((snapshot: unknown) => void) | null = null;

    onSnapshotMock.mockImplementation(
      (
        _ref: unknown,
        onNext: (snapshot: unknown) => void,
      ) => {
        emitSnapshot = onNext;
        return vi.fn();
      },
    );

    const { result } = renderHook(() =>
      useFiscalMonthlyComplianceAvailability({
        businessId: 'business-1',
        enabled: true,
      }),
    );

    expect(result.current).toEqual({
      enabled: false,
      error: null,
      resolved: false,
    });

    act(() => {
      emitSnapshot?.({
        data: () => ({
          features: {
            fiscal: {
              monthlyComplianceEnabled: true,
              reportingEnabled: true,
            },
          },
        }),
        exists: () => true,
      });
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        enabled: true,
        error: null,
        resolved: true,
      });
    });
  });

  it('blocks actions when monthly compliance is disabled', async () => {
    let emitSnapshot: ((snapshot: unknown) => void) | null = null;

    onSnapshotMock.mockImplementation(
      (
        _ref: unknown,
        onNext: (snapshot: unknown) => void,
      ) => {
        emitSnapshot = onNext;
        return vi.fn();
      },
    );

    const { result } = renderHook(() =>
      useFiscalMonthlyComplianceAvailability({
        businessId: 'business-1',
        enabled: true,
      }),
    );

    act(() => {
      emitSnapshot?.({
        data: () => ({
          features: {
            fiscal: {
              monthlyComplianceEnabled: false,
              reportingEnabled: true,
            },
          },
        }),
        exists: () => true,
      });
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        enabled: false,
        error: null,
        resolved: true,
      });
    });
  });

  it('fails closed when the business snapshot cannot be read', async () => {
    let emitError: ((cause: unknown) => void) | null = null;

    onSnapshotMock.mockImplementation(
      (
        _ref: unknown,
        _onNext: (snapshot: unknown) => void,
        onError: (cause: unknown) => void,
      ) => {
        emitError = onError;
        return vi.fn();
      },
    );

    const { result } = renderHook(() =>
      useFiscalMonthlyComplianceAvailability({
        businessId: 'business-1',
        enabled: true,
      }),
    );

    act(() => {
      emitError?.(new Error('permission-denied'));
    });

    await waitFor(() => {
      expect(result.current).toMatchObject({
        enabled: false,
        resolved: true,
      });
      expect(result.current.error).toContain('compliance mensual DGII');
    });
  });
});
