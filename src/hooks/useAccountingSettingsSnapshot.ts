import {
  doc,
  onSnapshot,
  type DocumentData,
  type FirestoreError,
} from 'firebase/firestore';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { db } from '@/firebase/firebaseconfig';

export type AccountingSettingsSnapshotStatus =
  | 'disabled'
  | 'loading'
  | 'ready'
  | 'error';

export interface AccountingSettingsSnapshotState {
  businessId: string | null;
  status: AccountingSettingsSnapshotStatus;
  data: Record<string, unknown> | null;
  error: FirestoreError | null;
}

interface AccountingSettingsStoreEntry {
  state: AccountingSettingsSnapshotState;
  listeners: Set<() => void>;
  unsubscribe: (() => void) | null;
}

const accountingSettingsStores = new Map<
  string,
  AccountingSettingsStoreEntry
>();

export const toCleanBusinessId = (
  businessId: string | null | undefined,
): string | null => {
  if (typeof businessId !== 'string') return null;
  const trimmed = businessId.trim();
  return trimmed.length ? trimmed : null;
};

const createDisabledSnapshot = (
  businessId: string | null,
): AccountingSettingsSnapshotState => ({
  businessId,
  status: 'disabled',
  data: null,
  error: null,
});

const createLoadingSnapshot = (
  businessId: string,
): AccountingSettingsSnapshotState => ({
  businessId,
  status: 'loading',
  data: null,
  error: null,
});

const createReadySnapshot = (
  businessId: string,
  data: Record<string, unknown> | null,
): AccountingSettingsSnapshotState => ({
  businessId,
  status: 'ready',
  data,
  error: null,
});

const createErrorSnapshot = (
  businessId: string,
  error: FirestoreError,
): AccountingSettingsSnapshotState => ({
  businessId,
  status: 'error',
  data: null,
  error,
});

const toSnapshotData = (data: DocumentData | undefined) =>
  data ? { ...data } : null;

const notifyListeners = (entry: AccountingSettingsStoreEntry) => {
  entry.listeners.forEach((listener) => listener());
};

const updateStoreState = (
  businessId: string,
  state: AccountingSettingsSnapshotState,
) => {
  const entry = accountingSettingsStores.get(businessId);
  if (!entry) return;

  entry.state = state;
  notifyListeners(entry);
};

const createStoreEntry = (
  businessId: string,
): AccountingSettingsStoreEntry => {
  const entry: AccountingSettingsStoreEntry = {
    state: createLoadingSnapshot(businessId),
    listeners: new Set(),
    unsubscribe: null,
  };
  accountingSettingsStores.set(businessId, entry);

  return entry;
};

const startStoreListener = (
  businessId: string,
  entry: AccountingSettingsStoreEntry,
) => {
  const settingsRef = doc(
    db,
    'businesses',
    businessId,
    'settings',
    'accounting',
  );

  entry.unsubscribe = onSnapshot(
    settingsRef,
    (snapshot) => {
      updateStoreState(
        businessId,
        createReadySnapshot(
          businessId,
          snapshot.exists() ? toSnapshotData(snapshot.data()) : null,
        ),
      );
    },
    (error) => {
      updateStoreState(businessId, createErrorSnapshot(businessId, error));
    },
  );
};

const subscribeToAccountingSettings = (
  businessId: string,
  listener: () => void,
) => {
  const existingEntry = accountingSettingsStores.get(businessId);
  const entry = existingEntry ?? createStoreEntry(businessId);
  entry.listeners.add(listener);
  if (!existingEntry) {
    startStoreListener(businessId, entry);
  }

  return () => {
    const currentEntry = accountingSettingsStores.get(businessId);
    if (!currentEntry) return;

    currentEntry.listeners.delete(listener);
    if (currentEntry.listeners.size > 0) return;

    currentEntry.unsubscribe?.();
    accountingSettingsStores.delete(businessId);
  };
};

export const useAccountingSettingsSnapshot = (
  businessId: string | null | undefined,
  isEnabled = true,
): AccountingSettingsSnapshotState => {
  const normalizedBusinessId = toCleanBusinessId(businessId);
  const fallbackSnapshot = useMemo(
    () =>
      normalizedBusinessId && isEnabled
        ? createLoadingSnapshot(normalizedBusinessId)
        : createDisabledSnapshot(normalizedBusinessId),
    [isEnabled, normalizedBusinessId],
  );

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!isEnabled || !normalizedBusinessId) {
        return () => {};
      }

      return subscribeToAccountingSettings(normalizedBusinessId, listener);
    },
    [isEnabled, normalizedBusinessId],
  );

  const getSnapshot = useCallback(() => {
    if (!isEnabled || !normalizedBusinessId) {
      return fallbackSnapshot;
    }

    return (
      accountingSettingsStores.get(normalizedBusinessId)?.state ??
      fallbackSnapshot
    );
  }, [fallbackSnapshot, isEnabled, normalizedBusinessId]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
