import {
  getFirestore,
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';

const db = getFirestore();

type BasicUserDoc = {
  id: string;
  displayName?: string;
  email?: string;
  [key: string]: unknown;
};

const normalizeString = (value: unknown): string =>
  typeof value === 'string' ? value.toLowerCase() : '';

/**
 * Obtiene una lista de usuarios de la base de datos
 * @param {number} maxUsers - Número máximo de usuarios a obtener (por defecto 50)
 * @returns {Promise<Array>} Lista de usuarios con información básica
 */
export const fbGetUsers = async (maxUsers = 50): Promise<BasicUserDoc[]> => {
  console.log('🔍 Iniciando consulta de usuarios...');
  const usersRef = collection(db, 'users');

  // Primero intentamos sin orderBy para evitar problemas con campos faltantes
  let q;
  try {
    q = query(usersRef, limit(maxUsers));
    console.log('📋 Ejecutando consulta de usuarios...');

    const querySnapshot = await getDocs(q);
    console.log('📊 Documentos encontrados:', querySnapshot.size);

    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() ?? {}),
    }));

    console.log('✅ Usuarios procesados:', users.length);
    return users;
  } catch (queryError) {
    console.error('❌ Error en la consulta:', queryError);
  }

  return [];
};

/**
 * Busca usuarios por nombre o email
 * @param {string} searchTerm - Término de búsqueda
 * @param {number} maxUsers - Número máximo de usuarios a obtener
 * @returns {Promise<Array>} Lista de usuarios filtrados
 */
export const fbSearchUsers = async (
  searchTerm: string,
  maxUsers = 20,
): Promise<BasicUserDoc[]> => {
  try {
    const users = await fbGetUsers(100); // Obtener más usuarios para filtrar

    if (!searchTerm) return users.slice(0, maxUsers);

    const filtered = users.filter(
      (user) => {
        const term = normalizeString(searchTerm);
        return (
          normalizeString(user.displayName).includes(term) ||
          normalizeString(user.email).includes(term) ||
          normalizeString(user.id).includes(term)
        );
      },
    );

    return filtered.slice(0, maxUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    const message =
      error instanceof Error ? error.message : 'Error desconocido';
    throw new Error('Error al buscar usuarios: ' + message);
  }
};
