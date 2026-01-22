import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

type ValidateUserRequest = {
  username?: string;
  password?: string;
  uid?: string | null;
};

type ValidateUserResponse = {
  ok?: boolean;
  message?: string;
  userId?: string;
  user?: Record<string, unknown>;
};

const clientValidateUserCallable = httpsCallable<
  ValidateUserRequest,
  ValidateUserResponse
>(functions, 'clientValidateUser');

type UserCredentials = {
  name?: string;
  password?: string;
};

type ValidateUserResult = {
  userData: Record<string, unknown> & { uid: string | null };
  response: { error: string | null };
};

export const fbValidateUser = async (
  user: UserCredentials,
  uid?: string | null,
): Promise<ValidateUserResult> => {
  try {
    const response = await clientValidateUserCallable({
      username: user?.name,
      password: user?.password,
      uid,
    });

    const data = response?.data || {};
    return {
      userData: {
        uid: data?.userId || uid || null,
        ...data?.user,
      },
      response: { error: null },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error verificando usuario';
    return {
      userData: { uid: uid || null },
      response: { error: message },
    };
  }
};
