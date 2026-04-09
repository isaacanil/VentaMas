import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const useAccountingRolloutEnabledMock = vi.hoisted(() => vi.fn());
const docMock = vi.hoisted(() => vi.fn());
const onSnapshotMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useAccountingRolloutEnabled', () => ({
  useAccountingRolloutEnabled: (...args: unknown[]) =>
    useAccountingRolloutEnabledMock(...args),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: { name: 'db-mock' },
}));

import { useDocumentCurrencyConfig } from './useDocumentCurrencyConfig';

describe('useDocumentCurrencyConfig', () => {
  it('retorna estado deshabilitado sin lanzar errores cuando el rollout no aplica', () => {
    useAccountingRolloutEnabledMock.mockReturnValue(false);

    const { result } = renderHook(() =>
      useDocumentCurrencyConfig('business-1'),
    );

    expect(result.current.enabled).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.config.functionalCurrency).toBe('DOP');
    expect(docMock).not.toHaveBeenCalled();
    expect(onSnapshotMock).not.toHaveBeenCalled();
  });
});
