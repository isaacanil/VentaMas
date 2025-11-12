import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../firebaseconfig';

export const fbGetUsers = (currentUser, setUsers, onError) => {
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
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        console.error('Error fetching users: ', error);
      }
    },
  );
  return unsubscribe;
};
