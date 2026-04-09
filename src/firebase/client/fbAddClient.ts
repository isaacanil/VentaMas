import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';
import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';

import { buildClientWritePayload } from './clientNormalizer';
import type { ClientInput, NormalizedClient } from './clientNormalizer';

type UserWithBusiness = {
  businessID: string;
};

export const fbAddClient = async (
  user: UserWithBusiness | null | undefined,
  client: ClientInput,
): Promise<NormalizedClient> => {
  try {
    if (!user || !user.businessID) throw new Error('No user or businessID');
    const { sessionToken } = getStoredSession();
    const createClientCallable = httpsCallable<
      {
        businessId: string;
        client: ClientInput;
        sessionToken?: string;
      },
      {
        ok: boolean;
        client?: NormalizedClient;
      }
    >(functions, 'createClient');

    const response = await createClientCallable({
      businessId: user.businessID,
      client,
      ...(sessionToken ? { sessionToken } : {}),
    });

    if (response.data?.ok !== true) {
      throw new Error('No se pudo crear el cliente');
    }

    const normalizedClient =
      response.data?.client ?? buildClientWritePayload(client).client;
    return normalizedClient;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error instanceof Error
      ? error
      : new Error('No se pudo crear el cliente');
  }
};
