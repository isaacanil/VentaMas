import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { toMillis } from '@/utils/date/toMillis';
import type { ExpenseCategoryDoc } from '@/utils/expenses/types';

export const useFbGetExpensesCategories = () => {
  const user = useSelector(selectUser);
  const [categories, setCategories] = useState<ExpenseCategoryDoc[]>([]);

  useEffect(() => {
    if (!user?.businessID) return;

    const categoriesCollection = collection(
      db,
      'businesses',
      user.businessID,
      'expensesCategories',
    );

    const fetchData = async () => {
      const unsubscribe = onSnapshot(categoriesCollection, (snapshot) => {
        const categoriesArray: ExpenseCategoryDoc[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          const category = data?.category ?? {};

          return {
            category: {
              ...category,
              id: category.id ?? docSnapshot.id,
              createdAt: toMillis(category.createdAt),
              deletedAt: toMillis(category.deletedAt),
              isDeleted: Boolean(category.isDeleted),
            },
          };
        });
        setCategories(categoriesArray);
      });

      return () => unsubscribe();
    };

    fetchData();
  }, [user?.businessID]);

  return { categories };
};
