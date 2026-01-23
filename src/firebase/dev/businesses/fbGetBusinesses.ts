import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

type BusinessData = Record<string, unknown>;

type SetBusinesses = (businesses: BusinessData[]) => void;

export const fbGetBusinesses = async (setBusinesses: SetBusinesses): Promise<void> => {
  const businessesRef = collection(db, 'businesses');

  onSnapshot(businessesRef, (snapshot) => {
    const businesses = snapshot.docs.map((doc) => doc.data() as BusinessData);
    setBusinesses(businesses);
  });
};
