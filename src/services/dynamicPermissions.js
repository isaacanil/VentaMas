import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebaseconfig';

/**
 * Servicio para gestionar permisos dinámicos de usuarios
 * Colección: /businesses/{businessID}/userPermissions/{userID}
 */

// Permisos disponibles organizados por rol
// Cada rol tiene sus propios permisos dinámicos disponibles
export const AVAILABLE_PERMISSIONS_BY_ROLE = {  // Permisos dinámicos para cajeros
  cashier: [
    { action: 'read', subject: 'PriceList', label: 'Ver Lista de Precios', category: 'pricing' },
    { action: 'modify', subject: 'Price', label: 'Modificar Precios', category: 'pricing' },
  ],
  
  // Permisos dinámicos para administradores (por si en el futuro se necesita)
  admin: [
    // Los admins normalmente tienen 'manage all', pero por si se quiere restringir algo específico
    // { action: 'developerAccess', subject: 'all', label: 'Acceso de Desarrollador', category: 'system' },
  ],
  
  // Permisos dinámicos para managers (para futuro)
  manager: [
    // { action: 'access', subject: 'Reports', label: 'Acceso a Reportes Avanzados', category: 'reports' },
    // { action: 'manage', subject: 'Discounts', label: 'Gestionar Descuentos', category: 'sales' },
  ],
  
  // Permisos dinámicos para compradores (para futuro)
  buyer: [
    // { action: 'access', subject: 'Analytics', label: 'Acceso a Analíticas', category: 'analytics' },
    // { action: 'export', subject: 'Data', label: 'Exportar Datos', category: 'data' },
  ],
  
  // Permisos generales disponibles para cualquier rol
  general: [
    // { action: 'access', subject: 'HelpDesk', label: 'Acceso a Mesa de Ayuda', category: 'support' },
  ]
};

// Lista completa de permisos disponibles (para compatibilidad con código existente)
export const AVAILABLE_PERMISSIONS = [
  ...AVAILABLE_PERMISSIONS_BY_ROLE.cashier,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.admin,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.manager,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.buyer,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.general,
];

/**
 * Obtiene los permisos dinámicos disponibles para un rol específico
 * @param {string} role - El rol del usuario (cajero, admin, manager, buyer)
 * @returns {Array} Lista de permisos disponibles para ese rol
 */
export const getAvailablePermissionsForRole = (role) => {
  const rolePermissions = AVAILABLE_PERMISSIONS_BY_ROLE[role] || [];
  const generalPermissions = AVAILABLE_PERMISSIONS_BY_ROLE.general || [];
  return [...rolePermissions, ...generalPermissions];
};

/**
 * Obtiene permisos dinámicos de un usuario
 * @param {string} userId - ID del usuario del cual obtener permisos
 * @param {Object} currentUser - Usuario actual para obtener businessID (opcional, si no se pasa usa auth actual)
 * @returns {Promise<Object>} Permisos del usuario
 */
export const getUserDynamicPermissions = async (userId, currentUser = null) => {
  // Si no se pasa currentUser, obtenerlo del contexto de auth actual
  if (!currentUser) {
    // Por ahora, esto requerirá que siempre se pase currentUser
    throw new Error('currentUser es requerido para obtener permisos dinámicos');
  }
  
  // Validar que currentUser tenga businessID
  if (!currentUser.businessID) {
    console.warn('currentUser no tiene businessID, devolviendo permisos vacíos');
    return {
      userId: userId,
      businessID: null,
      additionalPermissions: [],
      restrictedPermissions: [],
      createdAt: null,
      updatedAt: null,
      createdBy: null
    };
  }
  
  try {
    const docRef = doc(db, 'businesses', currentUser.businessID, 'userPermissions', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return {
        userId: userId,
        businessID: currentUser.businessID,
        additionalPermissions: [],
        restrictedPermissions: [],
        createdAt: null,
        updatedAt: null,
        createdBy: null
      };
    }
  } catch (error) {
    console.error('Error al obtener permisos dinámicos:', error);
    return {
      userId: userId,
      businessID: currentUser?.businessID || null,
      additionalPermissions: [],
      restrictedPermissions: [],
      createdAt: null,
      updatedAt: null,
      createdBy: null
    };
  }
};

/**
 * Establece los permisos dinámicos de un usuario (versión simplificada)
 * @param {string} userID - ID del usuario
 * @param {Object} permissions - Objeto con additionalPermissions y restrictedPermissions
 * @returns {Promise<boolean>} Éxito de la operación
 */
export const setUserDynamicPermissions = async (currentUser, userId, permissions) => {
  try {

    const docRef = doc(db, 'businesses', currentUser.businessID, 'userPermissions', userId);
    const now = new Date();
    
    // Verificar si el documento existe
    const existingDoc = await getDoc(docRef);
    
    const permissionData = {
      userId: userId,
      businessID: currentUser.businessID,
      additionalPermissions: permissions.additionalPermissions || [],
      restrictedPermissions: permissions.restrictedPermissions || [],
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    };
    
    if (existingDoc.exists()) {
      // Actualizar documento existente
      await updateDoc(docRef, permissionData);
    } else {
      // Crear nuevo documento
      await setDoc(docRef, {
        ...permissionData,
        createdAt: now,
        createdBy: currentUser.uid
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error al establecer permisos dinámicos:', error);
    throw error;
  }
};

/**
 * Migra usuarios de cajeros especiales al sistema dinámico
 * @param {string} businessID - ID del negocio
 * @param {string} currentUserID - ID del usuario que ejecuta la migración
 * @returns {Promise<Object>} Resultado de la migración
 */
export const migrateCashierPermissions = async (businessID, currentUserID) => {
  try {
    // Esta función se ejecutará una vez para migrar usuarios existentes
    // Se podría llamar desde un componente admin o script de migración
    
    const migrationResults = {
      specialCashier1: [],
      specialCashier2: [],
      errors: []
    };
    
    // Aquí normalmente buscaríamos en la colección de usuarios
    // Por ahora, retornamos la estructura para implementación manual
    
            // Migration completed successfully
    return migrationResults;
    
  } catch (error) {
    console.error('Error en migración de cajeros:', error);
    return { errors: [error.message] };
  }
};

/**
 * Obtiene todos los usuarios con permisos dinámicos en un negocio
 * @param {string} businessID - ID del negocio
 * @returns {Promise<Array>} Lista de usuarios con permisos
 */
export const getAllUserPermissions = async (businessID) => {
  try {
    const permissionsRef = collection(db, 'businesses', businessID, 'userPermissions');
    const querySnapshot = await getDocs(permissionsRef);
    
    const userPermissions = [];
    querySnapshot.forEach((doc) => {
      userPermissions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return userPermissions;
  } catch (error) {
    console.error('Error al obtener todos los permisos:', error);
    return [];
  }
};

/**
 * Elimina los permisos dinámicos de un usuario
 * @param {string} businessID - ID del negocio
 * @param {string} userID - ID del usuario
 * @returns {Promise<boolean>} Éxito de la operación
 */
export const deleteUserDynamicPermissions = async (businessID, userID) => {
  try {
    const docRef = doc(db, 'businesses', businessID, 'userPermissions', userID);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error al eliminar permisos dinámicos:', error);
    return false;
  }
};

/**
 * Obtiene información sobre qué permisos están disponibles para un rol específico
 * @param {string} role - El rol del usuario
 * @returns {Object} Información sobre los permisos disponibles
 */
export const getRolePermissionsInfo = (role) => {
  const rolePermissions = AVAILABLE_PERMISSIONS_BY_ROLE[role] || [];
  const generalPermissions = AVAILABLE_PERMISSIONS_BY_ROLE.general || [];
  
  return {
    roleName: role,
    roleSpecificCount: rolePermissions.length,
    generalCount: generalPermissions.length,
    totalAvailable: rolePermissions.length + generalPermissions.length,
    categories: [...new Set([
      ...rolePermissions.map(p => p.category),
      ...generalPermissions.map(p => p.category)
    ])].filter(Boolean)
  };
};

export default {
  getUserDynamicPermissions,
  setUserDynamicPermissions,
  migrateCashierPermissions,
  getAllUserPermissions,
  deleteUserDynamicPermissions,
  AVAILABLE_PERMISSIONS
};
