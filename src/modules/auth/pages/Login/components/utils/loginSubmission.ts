import { fbSignIn, type FbSignInResult, type FbSignInUser } from '@/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn';

const isSignInUser = (value: unknown): value is FbSignInUser => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && record.id.length > 0;
};

const isValidSignInResult = (value: unknown): value is FbSignInResult => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return isSignInUser(record.user);
};

function assertIsValidSignInResult(
  value: unknown,
): asserts value is FbSignInResult {
  if (!isValidSignInResult(value)) {
    throw new Error('Respuesta inválida del servicio de autenticación.');
  }
}

type RunLoginSubmissionParams = {
  onError: (message: string) => void;
  onSettled: () => void;
  onSuccess: (user: FbSignInUser) => void;
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
    const rawResult: unknown = await fbSignIn({
      name: username,
      password,
    });

    assertIsValidSignInResult(rawResult);
    onSuccess(rawResult.user);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : 'No se pudo iniciar sesión. Inténtalo de nuevo.';

    onError(errorMessage);
  } finally {
    onSettled();
  }
}
