import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import { extractNormalizedClient } from './clientNormalizer';
import type { NormalizedClient } from './clientNormalizer';

type UserWithBusiness = {
  businessID: string;
};

/**
 * Fetches a client from the database by ID to check if they exist.
 *
 * @param {string} clientId - The ID of the client to fetch.
 * @param {function} fetchByIdFunction - Function to fetch the client by ID from the database.
 * @returns {Promise<object|null>} Returns the client object if found, or null if not found.
 */
export async function fbGetClient(
  user: UserWithBusiness,
  clientId: string,
): Promise<NormalizedClient | null> {
  try {
    // Verbose logs eliminados para producción

    // Verificar si clientId es una cadena válida
    if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
      console.error('fbGetClient - clientId inválido:', clientId);
      return null;
    }

    const clientRef = doc(
      db,
      'businesses',
      user.businessID,
      'clients',
      clientId,
    );
    //
    const clientSnapshot = await getDoc(clientRef);
    const clientExist = clientSnapshot.exists();
    if (clientExist) {
      return extractNormalizedClient(clientSnapshot.data());
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching the client:', error);
    throw error; // Rethrowing the error for the caller to handle it appropriately
  }
}
