import { useEffect, useState } from 'react';

import { fbGetBusinesses } from '@/firebase/dev/businesses/fbGetBusinesses';

import type { BusinessDoc, BusinessFeedState } from '../types';
import {
  getInitialBusinessFeedState,
  normalizeBusinessDoc,
} from '../utils/businessControl';

export const useBusinessFeed = (businessFeedKey: string | null) => {
  const [businessFeed, setBusinessFeed] = useState<BusinessFeedState>(
    getInitialBusinessFeedState,
  );

  useEffect(() => {
    if (!businessFeedKey) {
      return;
    }

    const unsubscribe = fbGetBusinesses(
      (rawBusinesses) => {
        const normalized = rawBusinesses
          .map((item) => normalizeBusinessDoc(item))
          .filter((item): item is BusinessDoc => Boolean(item));

        setBusinessFeed({
          items: normalized,
          error: null,
          resolvedKey: businessFeedKey,
        });
      },
      (snapshotError) => {
        console.error('Error al cargar los negocios:', snapshotError);
        setBusinessFeed((prev) => ({
          items: prev.resolvedKey === businessFeedKey ? prev.items : [],
          error:
            'No se pudieron cargar los negocios. Verifica permisos o intenta más tarde.',
          resolvedKey: businessFeedKey,
        }));
      },
    );

    return () => {
      unsubscribe();
    };
  }, [businessFeedKey]);

  return businessFeed;
};
