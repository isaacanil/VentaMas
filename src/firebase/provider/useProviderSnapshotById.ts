import { onSnapshot } from 'firebase/firestore';
import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import type { ProviderInfo } from '@/domain/providers/types';

import { getProviderDoc } from './providerRefs';

type ProviderSnapshotSetter = Dispatch<SetStateAction<ProviderInfo | null>>;

interface UseProviderSnapshotByIdOptions {
  businessId?: string | null;
  providerId?: string | null;
  onError?: (error: unknown) => void;
}

interface UseProviderSnapshotByIdResult {
  providerSnapshot: ProviderInfo | null;
  setProviderSnapshot: ProviderSnapshotSetter;
}

export const useProviderSnapshotById = ({
  businessId,
  providerId,
  onError,
}: UseProviderSnapshotByIdOptions): UseProviderSnapshotByIdResult => {
  const [providerSnapshot, setProviderSnapshot] =
    useState<ProviderInfo | null>(null);

  useEffect(() => {
    if (!businessId || !providerId) return undefined;

    const providerRef = getProviderDoc(businessId, providerId);

    const unsubscribe = onSnapshot(
      providerRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const nextProvider = snapshot.data()?.provider;
        if (!nextProvider) return;

        setProviderSnapshot((prev) => {
          const mergedProvider = prev
            ? { ...prev, ...nextProvider }
            : { ...nextProvider };

          return {
            ...mergedProvider,
            id: providerId,
          };
        });
      },
      (error) => {
        onError?.(error);
      },
    );

    return () => unsubscribe();
  }, [businessId, onError, providerId]);

  return { providerSnapshot, setProviderSnapshot };
};
