import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import type { CollectionReference, Unsubscribe } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';

type ProductBrand = {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
} & Record<string, unknown>;

type ProductBrandInput = Record<string, unknown> & { id?: string };

export const useListenProductBrands = () => {
  const [data, setData] = useState<ProductBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const user = useSelector(selectUser) as UserWithBusiness | null | undefined;

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    const fetchData = async () => {
      try {
        if (!user?.businessID) return;
        setLoading(true);
        unsubscribe = await listenProductBrands(user, setData);
        setLoading(false);
      } catch (err) {
        setError(err);
      }
    };

    fetchData();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  return { data, loading, error };
};

const listenProductBrands = (
  user: UserWithBusiness,
  setData: Dispatch<SetStateAction<ProductBrand[]>>,
) => {
  const brandsRef = collection(
    db,
    `businesses/${user.businessID}/productBrands`,
  ) as CollectionReference<ProductBrand>;
  const unsubscribe = onSnapshot(brandsRef, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => docSnap.data());
    setData(items);
  });
  return unsubscribe;
};

export const fbAddProductBrand = async (
  user: UserWithBusiness | null | undefined,
  data: ProductBrandInput,
) => {
  if (!user?.businessID) return;
  const newBrand: ProductBrand = {
    ...data,
    id: nanoid(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const brandRef = doc(
    db,
    `businesses/${user.businessID}/productBrands/${newBrand.id}`,
  );
  await setDoc(brandRef, newBrand);
};

export const fbUpdateProductBrand = async (
  user: UserWithBusiness | null | undefined,
  data: ProductBrandInput,
) => {
  if (!user?.businessID || !data?.id) return;
  const brandRef = doc(
    db,
    `businesses/${user.businessID}/productBrands/${data.id}`,
  );
  await updateDoc(brandRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};
