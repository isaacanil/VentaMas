import {
  signInWithPassword,
  type PasswordAuthUser,
} from '@/modules/auth/repositories/passwordAuth.repository';
import { assertIsValidSignInResult } from '@/modules/auth/utils/passwordLogin';

type RunLoginSubmissionParams = {
  onError: (message: string) => void;
  onSettled: () => void;
  onSuccess: (user: PasswordAuthUser) => void;
  password: string;
  username: string;
};

export async function runLoginSubmission({
  onError,
  onSettled,
  onSuccess,
  password,
  username,
}: RunLoginSubmissionParams) {
  try {
    const rawResult: unknown = await signInWithPassword({
      password,
      username,
    });

    assertIsValidSignInResult(rawResult);
    onSuccess(rawResult.user);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : 'No se pudo iniciar sesion. Intentalo de nuevo.';

    onError(errorMessage);
  } finally {
    onSettled();
  }
}
