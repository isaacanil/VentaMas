import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

type BusinessUser = Record<string, unknown> & { number: number };

type CurrentUser = {
  businessID?: string | null;
};

type UsersCallback = (users: BusinessUser[]) => void;
type ErrorCallback = (error: unknown) => void;
type LoadCallback = () => void;

export const fbGetUsers = (
  currentUser: CurrentUser,
  setUsers: UsersCallback,
  onError?: ErrorCallback,
  onLoad?: LoadCallback,
): (() => void) | undefined => {
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
      const usersArray: BusinessUser[] = snapshot.docs.map((doc, i) => ({
        ...(doc.data() ?? {}),
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
