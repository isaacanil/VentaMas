import {
  collection,
  onSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

type BusinessData = Record<string, unknown>;

type SetBusinesses = (businesses: BusinessData[]) => void;
type SetSnapshotError = (error: FirestoreError) => void;

export const fbGetBusinesses = (
  setBusinesses: SetBusinesses,
  onSnapshotError?: SetSnapshotError,
): Unsubscribe => {
  const businessesRef = collection(db, 'businesses');

  return onSnapshot(
    businessesRef,
    (snapshot) => {
      const businesses = snapshot.docs.map((doc) => ({
        ...(doc.data() as BusinessData),
        id: doc.id,
      }));
      setBusinesses(businesses);
    },
    (error) => {
      console.error('Error al escuchar negocios:', error);
      onSnapshotError?.(error);
    },
  );
};
