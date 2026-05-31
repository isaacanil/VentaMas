import {
  createPublicAccount,
  type PublicSignUpUser,
} from '@/modules/auth/repositories/passwordAuth.repository';

export type { PublicSignUpUser };

type RunSignUpSubmissionParams = {
  email: string;
  onError: (message: string) => void;
  onSettled: () => void;
  onSuccess: (user: PublicSignUpUser) => void;
  password: string;
};

export async function runSignUpSubmission({
  email,
  onError,
  onSettled,
  onSuccess,
  password,
}: RunSignUpSubmissionParams) {
  try {
    const result = await createPublicAccount({
      email,
      password,
    });

    onSuccess(result.user);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : 'No se pudo crear la cuenta.';

    onError(errorMessage);
  } finally {
    onSettled();
  }
}
