import { collection, getDocs, orderBy, query } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

type BusinessData = Record<string, unknown>;

type BusinessListItem = BusinessData & {
  id: string;
};

/**
 * Obtiene la lista de negocios de una sola vez (sin listener)
 * @returns {Promise<Array>} Array con la lista de negocios
 */
export const fbGetBusinessesList = async (): Promise<BusinessListItem[]> => {
  try {
    const businessesRef = collection(db, 'businesses');
    const q = query(businessesRef, orderBy('business.name', 'asc'));
    const snapshot = await getDocs(q);

    const businesses: BusinessListItem[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as BusinessData),
    }));

    return businesses;
  } catch (error) {
    console.error('Error al obtener la lista de negocios:', error);
    return [];
  }
};
