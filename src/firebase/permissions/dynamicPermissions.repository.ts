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
  UserDynamicPermissions,
} from '@/types/permissions';
import type { UserIdentity } from '@/types/users';

/**
 * Repositorio para gestionar permisos dinamicos de usuarios.
 * Coleccion: /businesses/{businessID}/userPermissions/{userID}
 */
export const buildEmptyPermissions = (
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
 * Obtiene permisos dinamicos de un usuario.
 * @param userId - ID del usuario del cual obtener permisos
 * @param currentUser - Usuario actual para obtener businessID
 * @returns Permisos del usuario
 */
export const getUserDynamicPermissions = async (
  userId: string,
  currentUser?: UserIdentity | null,
): Promise<UserDynamicPermissions> => {
  if (!currentUser) {
    throw new Error('currentUser es requerido para obtener permisos dinámicos');
  }

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
 * Establece los permisos dinamicos de un usuario.
 * @param currentUser - Usuario actual (para businessID)
 * @param userId - ID del usuario
 * @param permissions - Objeto con additionalPermissions y restrictedPermissions
 * @returns Exito de la operacion
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
      await updateDoc(
        docRef,
        permissionData as unknown as Record<string, unknown>,
      );
    } else {
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
 * Migra usuarios de cajeros especiales al sistema dinamico.
 * @param businessID - ID del negocio
 * @param currentUserID - ID del usuario que ejecuta la migracion
 * @returns Resultado de la migracion
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
    const migrationResults = {
      specialCashier1: [],
      specialCashier2: [],
      errors: [],
    };

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
 * Obtiene todos los usuarios con permisos dinamicos en un negocio.
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
 * Elimina los permisos dinamicos de un usuario.
 * @param businessID - ID del negocio
 * @param userID - ID del usuario
 * @returns Exito de la operacion
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
