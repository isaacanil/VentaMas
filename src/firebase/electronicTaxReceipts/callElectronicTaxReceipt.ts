import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';

export const createElectronicTaxReceiptCallable = <
  TInput extends object,
  TResult,
>(
  callableName: string,
) => {
  const callable = createFirebaseCallable<
    TInput & { sessionToken?: string },
    TResult
  >(callableName);

  return (input: TInput): Promise<TResult> => {
    const { sessionToken } = getStoredSession();
    return callable({
      ...input,
      ...(sessionToken ? { sessionToken } : {}),
    });
  };
};
