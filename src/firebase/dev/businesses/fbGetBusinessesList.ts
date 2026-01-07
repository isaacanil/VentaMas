// @ts-nocheck
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

/**
 * Obtiene la lista de negocios de una sola vez (sin listener)
 * @returns {Promise<Array>} Array con la lista de negocios
 */
export const fbGetBusinessesList = async () => {
  try {
    const businessesRef = collection(db, 'businesses');
    const q = query(businessesRef, orderBy('business.name', 'asc'));
    const snapshot = await getDocs(q);

    const businesses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return businesses;
  } catch (error) {
    console.error('Error al obtener la lista de negocios:', error);
    return [];
  }
};
