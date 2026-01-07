// @ts-nocheck
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbGetUsers = (currentUser, setUsers, onError, onLoad) => {
  if (!currentUser?.businessID) {
    return;
  }

  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('user.businessID', '==', currentUser.businessID),
    orderBy('user.createAt', 'desc'),
  );
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const usersArray = snapshot.docs.map((doc, i) => ({
        ...doc.data(),
        number: i + 1,
      }));

      setUsers(usersArray);
      if (onLoad) onLoad();
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        console.error('Error fetching users: ', error);
      }
      if (onLoad) onLoad();
    },
  );
  return unsubscribe;
};
