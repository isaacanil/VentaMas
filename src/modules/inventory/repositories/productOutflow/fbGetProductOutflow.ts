import {
  collection,
  onSnapshot,
  query,
  type Unsubscribe,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';
/* */
export const fbGetProductOutflow = ({
  user,
  setOutflowList,
  setOutflowListLoader,
}: {
  user: UserWithBusiness | null | undefined;
  setOutflowList: (items: Array<Record<string, unknown>>) => void;
  setOutflowListLoader: (isLoading: boolean) => void;
}): Unsubscribe | undefined => {
  if (!user?.businessID) return;

  const productOutflowRef = collection(
    db,
    'businesses',
    user.businessID,
    'productOutflow',
  );

  const q = query(productOutflowRef, where('isDeleted', '!=', true));

  setOutflowListLoader(true);
  let loaderTimeout: ReturnType<typeof setTimeout> | undefined;
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
      }

      if (snapshot.empty) {
        setOutflowList([]);
        setOutflowListLoader(false);
        return;
      }
      const productOutflowArray = snapshot.docs.map((doc) => doc.data());
      setOutflowList(productOutflowArray);
      loaderTimeout = setTimeout(() => {
        setOutflowListLoader(false);
      }, 1000);
    },
    (error) => {
      // maneja el error aquí
      console.error('Error al leer de Firestore: ', error);
    },
  );

  return () => {
    if (loaderTimeout) {
      clearTimeout(loaderTimeout);
    }
    unsubscribe();
  };
};
