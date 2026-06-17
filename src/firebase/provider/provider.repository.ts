import { onSnapshot } from 'firebase/firestore';

import { getProvidersCollection } from './providerRefs';
import type { ProviderDocument } from './types';

export const listenProviders = (
  businessId: string,
  onNext: (providers: ProviderDocument[]) => void,
  onError: (error: unknown) => void,
) => {
  const providersRef = getProvidersCollection(businessId);

  return onSnapshot(
    providersRef,
    (snapshot) => {
      onNext(snapshot.docs.map((item) => item.data()));
    },
    onError,
  );
};
