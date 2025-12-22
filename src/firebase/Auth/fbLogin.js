import { signInWithEmailAndPassword } from 'firebase/auth';

import { login } from '../../features/auth/userSlice';
import { auth } from '../firebaseconfig';

export const fbLogin = async (user, homePath, navigate, dispatch) => {
  const { email, password } = user;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredencial) => {
      const user = userCredencial.user;
      dispatch(
        login({
          email: user.email,
          uid: user.uid,
          displayName: user.displayName,
        }),
      );
      navigate(homePath);
    })
    .catch((error) => {
      console.error('Error logging in', error);
    });
};
