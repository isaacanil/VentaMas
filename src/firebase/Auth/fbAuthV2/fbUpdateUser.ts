import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

import { fbCheckIfUserExists } from './fbCheckIfUserExists';

type UpdateUserInput = {
  id?: string | null;
  name?: string | null;
  [key: string]: unknown;
};

type UpdateUserRequest = {
  userData: UpdateUserInput;
};

type UpdateUserResponse = {
  ok?: boolean;
  message?: string;
  [key: string]: unknown;
};

type ChangePasswordRequest = {
  userId: string;
  oldPassword: string;
  newPassword: string;
};

type ChangePasswordResponse = {
  ok?: boolean;
  message?: string;
};

const clientUpdateUserCallable = httpsCallable<
  UpdateUserRequest,
  UpdateUserResponse
>(functions, 'clientUpdateUser');
const clientChangePasswordCallable = httpsCallable<
  ChangePasswordRequest,
  ChangePasswordResponse
>(functions, 'clientChangePassword');

export const fbUpdateUser = async (
  userData: UpdateUserInput,
): Promise<void> => {
  const userExists = await fbCheckIfUserExists(
    userData?.name ?? '',
    userData?.id ?? null,
  );

  if (userExists) {
    throw new Error('Error: Ya existe un usuario con este nombre.');
  }

  try {
    await clientUpdateUserCallable({ userData });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error actualizando usuario';
    throw new Error(message);
  }
};

export const fbUpdateUserPassword = async (
  uid: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> => {
  try {
    await clientChangePasswordCallable({
      userId: uid,
      oldPassword,
      newPassword,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Error actualizando la contraseña';
    throw new Error(message);
  }
};
