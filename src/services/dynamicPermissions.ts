import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type {
  DynamicPermissionsPayload,
  PermissionDefinition,
  RolePermissionsInfo,
  UserDynamicPermissions,
} from '@/types/permissions';
import type { UserIdentity, UserRoleLike } from '@/types/users';

/**
 * Servicio para gestionar permisos dinámicos de usuarios
 * Colección: /businesses/{businessID}/userPermissions/{userID}
 */

const ROLE_PERMISSION_KEYS = ['cashier', 'admin', 'manager', 'buyer'] as const;
type PermissionRoleKey = (typeof ROLE_PERMISSION_KEYS)[number];

type PermissionCatalogKey = PermissionRoleKey | 'general';

const isPermissionRoleKey = (
  role?: UserRoleLike | null,
): role is PermissionRoleKey =>
  ROLE_PERMISSION_KEYS.includes(role as PermissionRoleKey);

// Permisos disponibles organizados por rol
// Cada rol tiene sus propios permisos dinámicos disponibles
export const AVAILABLE_PERMISSIONS_BY_ROLE: Record<
  PermissionCatalogKey,
  PermissionDefinition[]
> = {
  // Permisos dinámicos para cajeros
  cashier: [
    {
      action: 'read',
      subject: 'PriceList',
      label: 'Ver lista de precios en carrito',
      description:
        'Permite consultar la lista de precios mientras se toma una venta desde el carrito.',
      category: 'Ventas · Carrito',
    },
    {
      action: 'modify',
      subject: 'Price',
      label: 'Modificar precios en facturación',
      description:
        'Autoriza actualizar manualmente los precios durante la facturación.',
      category: 'Ventas · Carrito',
    },
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
  ],
};

// Lista completa de permisos disponibles (para compatibilidad con código existente)
export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  ...AVAILABLE_PERMISSIONS_BY_ROLE.cashier,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.admin,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.manager,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.buyer,
  ...AVAILABLE_PERMISSIONS_BY_ROLE.general,
];

const buildEmptyPermissions = (
  userId: string,
  businessID: string | null,
): UserDynamicPermissions => ({
  userId,
  businessID,
  additionalPermissions: [],
  restrictedPermissions: [],
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
});

/**
 * Obtiene los permisos dinámicos disponibles para un rol específico
 * @param role - El rol del usuario (cajero, admin, manager, buyer)
 * @returns Lista de permisos disponibles para ese rol
 */
export const getAvailablePermissionsForRole = (
  role?: UserRoleLike | null,
): PermissionDefinition[] => {
  const rolePermissions = isPermissionRoleKey(role)
    ? AVAILABLE_PERMISSIONS_BY_ROLE[role]
    : [];
  const generalPermissions = AVAILABLE_PERMISSIONS_BY_ROLE.general || [];
  return [...rolePermissions, ...generalPermissions];
};

/**
 * Obtiene permisos dinámicos de un usuario
 * @param userId - ID del usuario del cual obtener permisos
 * @param currentUser - Usuario actual para obtener businessID
 * @returns Permisos del usuario
 */
export const getUserDynamicPermissions = async (
  userId: string,
  currentUser?: UserIdentity | null,
): Promise<UserDynamicPermissions> => {
  // Si no se pasa currentUser, obtenerlo del contexto de auth actual
  if (!currentUser) {
    // Por ahora, esto requerirá que siempre se pase currentUser
    throw new Error('currentUser es requerido para obtener permisos dinámicos');
  }

  // Validar que currentUser tenga businessID
  if (!currentUser.businessID) {
    console.warn(
      'currentUser no tiene businessID, devolviendo permisos vacíos',
    );
    return buildEmptyPermissions(userId, null);
  }

  try {
    const docRef = doc(
      db,
      'businesses',
      currentUser.businessID,
      'userPermissions',
      userId,
    );
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserDynamicPermissions;
      return {
        ...buildEmptyPermissions(userId, currentUser.businessID),
        ...data,
      };
    }

    return buildEmptyPermissions(userId, currentUser.businessID);
  } catch (error) {
    console.error('Error al obtener permisos dinámicos:', error);
    return buildEmptyPermissions(userId, currentUser?.businessID || null);
  }
};

/**
 * Establece los permisos dinámicos de un usuario (versión simplificada)
 * @param currentUser - Usuario actual (para businessID)
 * @param userId - ID del usuario
 * @param permissions - Objeto con additionalPermissions y restrictedPermissions
 * @returns Éxito de la operación
 */
export const setUserDynamicPermissions = async (
  currentUser: UserIdentity | null | undefined,
  userId: string,
  permissions: DynamicPermissionsPayload,
): Promise<boolean> => {
  if (!currentUser?.businessID) {
    throw new Error(
      'currentUser.businessID es requerido para guardar permisos dinámicos',
    );
  }

  try {
    const docRef = doc(
      db,
      'businesses',
      currentUser.businessID,
      'userPermissions',
      userId,
    );
    const now = new Date();
    const updatedBy = currentUser.uid ?? currentUser.id ?? null;

    // Verificar si el documento existe
    const existingDoc = await getDoc(docRef);

    const permissionData: UserDynamicPermissions = {
      userId,
      businessID: currentUser.businessID,
      additionalPermissions: permissions.additionalPermissions || [],
      restrictedPermissions: permissions.restrictedPermissions || [],
      updatedAt: serverTimestamp(),
      updatedBy,
    };

    if (existingDoc.exists()) {
      // Actualizar documento existente
      await updateDoc(
        docRef,
        permissionData as unknown as Record<string, unknown>,
      );
    } else {
      // Crear nuevo documento
      await setDoc(docRef, {
        ...permissionData,
        createdAt: now,
        createdBy: updatedBy,
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
 * @param businessID - ID del negocio
 * @param currentUserID - ID del usuario que ejecuta la migración
 * @returns Resultado de la migración
 */
export const migrateCashierPermissions = async (
  _businessID: string,
  _currentUserID: string,
): Promise<{
  specialCashier1: string[];
  specialCashier2: string[];
  errors: string[];
}> => {
  try {
    // Esta función se ejecutará una vez para migrar usuarios existentes
    // Se podría llamar desde un componente admin o script de migración

    const migrationResults = {
      specialCashier1: [],
      specialCashier2: [],
      errors: [],
    };

    // Aquí normalmente buscaríamos en la colección de usuarios
    // Por ahora, retornamos la estructura para implementación manual

    // Migration completed successfully
    return migrationResults;
  } catch (error) {
    console.error('Error en migración de cajeros:', error);
    return {
      errors: [error instanceof Error ? error.message : String(error)],
      specialCashier1: [],
      specialCashier2: [],
    };
  }
};

/**
 * Obtiene todos los usuarios con permisos dinámicos en un negocio
 * @param businessID - ID del negocio
 * @returns Lista de usuarios con permisos
 */
export const getAllUserPermissions = async (
  businessID: string,
): Promise<Array<UserDynamicPermissions & { id: string }>> => {
  try {
    const permissionsRef = collection(
      db,
      'businesses',
      businessID,
      'userPermissions',
    );
    const querySnapshot = await getDocs(permissionsRef);

    const userPermissions: Array<UserDynamicPermissions & { id: string }> = [];
    querySnapshot.forEach((docSnap) => {
      userPermissions.push({
        id: docSnap.id,
        ...(docSnap.data() as UserDynamicPermissions),
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
 * @param businessID - ID del negocio
 * @param userID - ID del usuario
 * @returns Éxito de la operación
 */
export const deleteUserDynamicPermissions = async (
  businessID: string,
  userID: string,
): Promise<boolean> => {
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
 * @param role - El rol del usuario
 * @returns Información sobre los permisos disponibles
 */
export const getRolePermissionsInfo = (
  role?: UserRoleLike | null,
): RolePermissionsInfo => {
  const rolePermissions = isPermissionRoleKey(role)
    ? AVAILABLE_PERMISSIONS_BY_ROLE[role]
    : [];
  const generalPermissions = AVAILABLE_PERMISSIONS_BY_ROLE.general || [];

  return {
    roleName: role ?? null,
    roleSpecificCount: rolePermissions.length,
    generalCount: generalPermissions.length,
    totalAvailable: rolePermissions.length + generalPermissions.length,
    categories: [
      ...new Set([
        ...rolePermissions.map((p) => p.category),
        ...generalPermissions.map((p) => p.category),
      ]),
    ].filter((category): category is string => Boolean(category)),
  };
};

export default {
  getUserDynamicPermissions,
  setUserDynamicPermissions,
  migrateCashierPermissions,
  getAllUserPermissions,
  deleteUserDynamicPermissions,
  AVAILABLE_PERMISSIONS,
};
