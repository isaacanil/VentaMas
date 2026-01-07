// @ts-nocheck
import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

import { fbCheckIfUserExists } from './fbCheckIfUserExists';

const clientUpdateUserCallable = httpsCallable(functions, 'clientUpdateUser');
const clientChangePasswordCallable = httpsCallable(
  functions,
  'clientChangePassword',
);

export const fbUpdateUser = async (userData) => {
  const userExists = await fbCheckIfUserExists(userData?.name, userData?.id);

  if (userExists) {
    throw new Error('Error: Ya existe un usuario con este nombre.');
  }

  try {
    await clientUpdateUserCallable({ userData });
  } catch (error) {
    throw new Error(error?.message || 'Error actualizando usuario');
  }
};

export const fbUpdateUserPassword = async (uid, oldPassword, newPassword) => {
  try {
    await clientChangePasswordCallable({
      userId: uid,
      oldPassword,
      newPassword,
    });
  } catch (error) {
    throw new Error(error?.message || 'Error actualizando la contraseña');
  }
};
