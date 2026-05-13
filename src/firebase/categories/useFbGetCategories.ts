import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import type { CategoryDocument } from './types';

export const useFbGetCategories = () => {
  const [categories, setCategories] = useState<CategoryDocument[]>([]);
  const user = useSelector(selectUser) as UserIdentity | null | undefined;

  useEffect(() => {
    const categoriesRef = collection(
      db,
      'businesses',
      String(user?.businessID),
      'categories',
    );
    const q = query(categoriesRef, orderBy('category.name', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoriesArray = snapshot.docs.map(
        (item) => item.data() as CategoryDocument,
      );
      setCategories(categoriesArray);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.businessID]);

  return { categories };
};
