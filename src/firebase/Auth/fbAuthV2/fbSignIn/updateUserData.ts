// @ts-nocheck
import { onSnapshot, doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { login, logout } from '@/features/auth/userSlice';
import { addUserData } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';

export function useUserDocListener(userId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (userId) {
      const unsubscribe = onSnapshot(
        doc(db, 'users', userId),
        (userSnapshot) => {
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data().user;
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
