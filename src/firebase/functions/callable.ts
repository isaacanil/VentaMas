import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

export const createFirebaseCallable = <
  TPayload = unknown,
  TResult = unknown,
>(
  name: string,
) => {
  const callable = httpsCallable<TPayload, TResult>(functions, name);

  return async (payload: TPayload): Promise<TResult> => {
    const response = await callable(payload);
    return response.data;
  };
};
