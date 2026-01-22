import { signInWithEmailAndPassword } from 'firebase/auth';
import type { Dispatch } from 'redux';
import type { NavigateFunction } from 'react-router-dom';

import { login } from '@/features/auth/userSlice';
import { auth } from '@/firebase/firebaseconfig';

interface LoginCredentials {
  email: string;
  password: string;
}

export const fbLogin = async (
  user: LoginCredentials,
  homePath: string,
  navigate: NavigateFunction,
  dispatch: Dispatch,
): Promise<void> => {
  const { email, password } = user;

  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const authedUser = userCredential.user;
      dispatch(
        login({
          email: authedUser.email,
          uid: authedUser.uid,
          displayName: authedUser.displayName,
        }),
      );
      navigate(homePath);
    })
    .catch((error) => {
      console.error('Error logging in', error);
    });
};
