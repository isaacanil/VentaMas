import type { NavigateFunction } from 'react-router-dom';

import { navigateSafely } from './functions/navigateUser';
import { registerUser } from './functions/registerUser';
import type { SignUpUserInput } from './functions/types';
import { validateInputs } from './functions/validateInputs';

export const fbSignUpUserAccount = async (
  user: SignUpUserInput,
  navigate: NavigateFunction,
): Promise<void> => {
  try {
    validateInputs(user);
    await registerUser(user);
    await navigateSafely(navigate, '/users/list');
  } catch (error) {
    console.error('Error in handleRegister:', error);
    throw error;
  }
};
