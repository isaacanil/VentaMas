import { onSnapshot, doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { login, logout } from '@/features/auth/userSlice';
import { addUserData } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';

type UserDocData = {
  user?: {
    realName?: string;
    name?: string;
    businessID?: string;
    role?: string;
  } | null;
};

export function useUserDocListener(userId: string | null | undefined): void {
  const dispatch = useDispatch();

  useEffect(() => {
    if (userId) {
      const unsubscribe = onSnapshot(
        doc(db, 'users', userId),
        (userSnapshot) => {
          if (userSnapshot.exists()) {
            const data = userSnapshot.data() as UserDocData;
            const userData = data?.user;
            const username = userData?.realName
              ? userData?.realName
              : userData?.name;

            // Actualizar datos de perfil
            dispatch(
              login({
                uid: userSnapshot.id,
                displayName: username,
                realName: userData?.realName,
                username: userData?.name,
              }),
            );

            // Actualizar datos de negocio y rol
            dispatch(
              addUserData({
                businessID: userData?.businessID,
                role: userData?.role,
              }),
            );
          } else {
            dispatch(logout());
          }
        },
      );

      return () => unsubscribe();
    }
  }, [userId, dispatch]);
}
