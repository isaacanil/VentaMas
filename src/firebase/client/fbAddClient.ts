import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';

import { buildClientWritePayload } from './clientNormalizer';
import type { ClientInput, NormalizedClient } from './clientNormalizer';

type UserWithBusiness = {
  businessID: string;
};
type CreateClientPayload = {
  businessId: string;
  client: ClientInput;
  sessionToken?: string;
};
type CreateClientResult = {
  ok: boolean;
  client?: NormalizedClient;
};

const createClientCallable = createFirebaseCallable<
  CreateClientPayload,
  CreateClientResult
>('createClient');

export const fbAddClient = async (
  user: UserWithBusiness | null | undefined,
  client: ClientInput,
): Promise<NormalizedClient> => {
  try {
    if (!user || !user.businessID) throw new Error('No user or businessID');
    const { sessionToken } = getStoredSession();

    const result = await createClientCallable({
      businessId: user.businessID,
      client,
      ...(sessionToken ? { sessionToken } : {}),
    });

    if (result.ok !== true) {
      throw new Error('No se pudo crear el cliente');
    }

    const normalizedClient =
      result.client ?? buildClientWritePayload(client).client;
    return normalizedClient;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error instanceof Error
      ? error
      : new Error('No se pudo crear el cliente');
  }
};
