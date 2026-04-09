import { fbPublicSignUp } from '@/firebase/Auth/fbAuthV2/fbPublicSignUp';

export type PublicSignUpUser = Awaited<
  ReturnType<typeof fbPublicSignUp>
>['user'];

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
    const result = await fbPublicSignUp({
      name: email,
      realName: null,
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
