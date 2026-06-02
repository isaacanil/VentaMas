import {
  httpsCallable,
  type Functions,
  type HttpsCallableOptions,
} from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

const createCallableRunner = <
  TPayload = unknown,
  TResult = unknown,
>(
  functionsInstance: Functions,
  name: string,
  options?: HttpsCallableOptions,
) => {
  const callable = httpsCallable<TPayload, TResult>(
    functionsInstance,
    name,
    options,
  );

  return async (payload: TPayload): Promise<TResult> => {
    const response = await callable(payload);
    return response.data;
  };
};

export const createFirebaseCallable = <
  TPayload = unknown,
  TResult = unknown,
>(
  name: string,
  options?: HttpsCallableOptions,
) => createCallableRunner<TPayload, TResult>(functions, name, options);

export const createFirebaseCallableFor = <
  TPayload = unknown,
  TResult = unknown,
>(
  functionsInstance: Functions,
  name: string,
  options?: HttpsCallableOptions,
) =>
  createCallableRunner<TPayload, TResult>(
    functionsInstance,
    name,
    options,
  );
