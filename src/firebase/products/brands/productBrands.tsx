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
import type { ProductBrand as ProductBrandRecord } from '@/types/products';

type ProductBrand = ProductBrandRecord & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
} & Record<string, unknown>;

type ProductBrandInput = Record<string, unknown> & { id?: string };

export const useListenProductBrands = () => {
  const [data, setData] = useState<ProductBrand[] | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const user = useSelector(selectUser) as UserWithBusiness | null | undefined;

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    if (!user?.businessID) return;

    void Promise.resolve(listenProductBrands(user, setData, setError)).then(
      (nextUnsubscribe) => {
        unsubscribe = nextUnsubscribe;
      },
      (err) => {
        setError(err);
      },
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  return {
    data: data ?? [],
    loading: Boolean(user?.businessID) && data === null && !error,
    error,
  };
};

const listenProductBrands = (
  user: UserWithBusiness,
  setData: Dispatch<SetStateAction<ProductBrand[]>>,
  setError: Dispatch<SetStateAction<unknown | null>>,
) => {
  const brandsRef = collection(
    db,
    `businesses/${user.businessID}/productBrands`,
  ) as CollectionReference<ProductBrand>;
  const unsubscribe = onSnapshot(
    brandsRef,
    (snapshot) => {
      setError(null);
      const items = snapshot.docs.map((docSnap) => docSnap.data());
      setData(items);
    },
    (err) => {
      setError(err);
    },
  );
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
