import { createFirebaseCallable } from '@/firebase/functions/callable';

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

const clientValidateUserCallable = createFirebaseCallable<
  ValidateUserRequest,
  ValidateUserResponse
>('clientValidateUser');

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
    const data = await clientValidateUserCallable({
      username: user?.name,
      password: user?.password,
      uid,
    });

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
