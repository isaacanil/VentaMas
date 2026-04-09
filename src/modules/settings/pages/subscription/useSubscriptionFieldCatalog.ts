import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';

import {
  createEmptySubscriptionFieldCatalog,
  normalizeSubscriptionFieldCatalog,
  serializeSubscriptionFieldCatalog,
  type SubscriptionFieldCatalog,
} from './subscriptionFieldCatalog';

const SUBSCRIPTION_FIELD_CATALOG_COLLECTION = 'billingConfig';
const SUBSCRIPTION_FIELD_CATALOG_DOCUMENT = 'subscriptionFieldCatalog';
const EMPTY_SUBSCRIPTION_FIELD_CATALOG = createEmptySubscriptionFieldCatalog();

export const useSubscriptionFieldCatalog = (
  enabled = true,
): SubscriptionFieldCatalog => {
  const [fieldCatalog, setFieldCatalog] = useState<SubscriptionFieldCatalog>(
    EMPTY_SUBSCRIPTION_FIELD_CATALOG,
  );

  useEffect(() => {
    if (enabled === false) {
      return undefined;
    }

    const configRef = doc(
      db,
      SUBSCRIPTION_FIELD_CATALOG_COLLECTION,
      SUBSCRIPTION_FIELD_CATALOG_DOCUMENT,
    );

    const unsubscribe = onSnapshot(
      configRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.warn(
            'No existe billingConfig/subscriptionFieldCatalog. El frontend no autosembrara este documento.',
          );
          setFieldCatalog(EMPTY_SUBSCRIPTION_FIELD_CATALOG);
          return;
        }

        setFieldCatalog(normalizeSubscriptionFieldCatalog(snapshot.data()));
      },
      (error) => {
        console.error(
          'No se pudo escuchar billingConfig/subscriptionFieldCatalog:',
          error,
        );
        setFieldCatalog(EMPTY_SUBSCRIPTION_FIELD_CATALOG);
      },
    );

    return () => unsubscribe();
  }, [enabled]);

  return enabled ? fieldCatalog : EMPTY_SUBSCRIPTION_FIELD_CATALOG;
};

export const saveSubscriptionFieldCatalog = async (
  catalog: SubscriptionFieldCatalog,
): Promise<void> => {
  const configRef = doc(
    db,
    SUBSCRIPTION_FIELD_CATALOG_COLLECTION,
    SUBSCRIPTION_FIELD_CATALOG_DOCUMENT,
  );
  await setDoc(
    configRef,
    {
      ...serializeSubscriptionFieldCatalog(catalog),
      updatedAt: serverTimestamp(),
      source: 'subscription_field_catalog_manual',
    },
    { merge: true },
  );
};
