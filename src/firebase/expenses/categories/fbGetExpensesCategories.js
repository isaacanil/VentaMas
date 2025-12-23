import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';

const toMillis = (value) => {
  if (!value && value !== 0) return null;
  if (typeof value === 'number') return value;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  return null;
};

export const useFbGetExpensesCategories = () => {
  const user = useSelector(selectUser);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user || !user?.businessID) return;

    const categoriesCollection = collection(
      db,
      'businesses',
      user.businessID,
      'expensesCategories',
    );

    const fetchData = async () => {
      const unsubscribe = onSnapshot(categoriesCollection, (snapshot) => {
        const categoriesArray = snapshot.docs.map((docSnapshot) => {
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
  }, [user]);

  return { categories };
};
