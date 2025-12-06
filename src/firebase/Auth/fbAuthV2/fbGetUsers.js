import {
  getFirestore,
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';

const db = getFirestore();

/**
 * Obtiene una lista de usuarios de la base de datos
 * @param {number} maxUsers - Número máximo de usuarios a obtener (por defecto 50)
 * @returns {Promise<Array>} Lista de usuarios con información básica
 */
export const fbGetUsers = async (maxUsers = 50) => {
  console.log('🔍 Iniciando consulta de usuarios...');
  const usersRef = collection(db, 'users');

  // Primero intentamos sin orderBy para evitar problemas con campos faltantes
  let q;
  try {
    q = query(usersRef, limit(maxUsers));
    console.log('📋 Ejecutando consulta de usuarios...');

    const querySnapshot = await getDocs(q);
    console.log('📊 Documentos encontrados:', querySnapshot.size);

    const users = querySnapshot.docs.map((doc) => doc.data());

    console.log('✅ Usuarios procesados:', users.length);
    return users;
  } catch (queryError) {
    console.error('❌ Error en la consulta:', queryError);
  }
};

/**
 * Busca usuarios por nombre o email
 * @param {string} searchTerm - Término de búsqueda
 * @param {number} maxUsers - Número máximo de usuarios a obtener
 * @returns {Promise<Array>} Lista de usuarios filtrados
 */
export const fbSearchUsers = async (searchTerm, maxUsers = 20) => {
  try {
    const users = await fbGetUsers(100); // Obtener más usuarios para filtrar

    if (!searchTerm) return users.slice(0, maxUsers);

    const filtered = users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return filtered.slice(0, maxUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error('Error al buscar usuarios: ' + error.message);
  }
};
