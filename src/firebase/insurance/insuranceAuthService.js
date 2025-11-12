import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useState, useEffect } from 'react';

import { db } from '../firebaseconfig';

/**
 * Retorna la referencia a la colección "insuranceAuths".
 *
 * @returns {CollectionReference} - Referencia a la colección.
 */
const getInsuranceAuthsCollection = () => {
  return collection(db, 'insuranceAuths');
};

/**
 * Adds or updates an insurance authorization to the system.
 * If the client already has an authorization, it will update it instead of creating a new one.
 * Otherwise, generates a custom ID using nanoid and sets audit fields using user.uid.
 *
 * @param {object} user - The user object with businessID and uid.
 * @param {object} authData - The data of the insurance authorization.
 * @param {string} clientId - The ID of the client to associate with the authorization.
 * @returns {Promise<string>} - The ID of the added or updated authorization.
 */

const toFirestoreTimestamp = (dateValue) => {
  if (!dateValue) return null;

  // Si ya es un Timestamp, devolverlo directamente
  if (dateValue instanceof Timestamp) return dateValue;

  // Si es una fecha de JS
  if (dateValue instanceof Date) return Timestamp.fromDate(dateValue);

  // Si es un string ISO o cualquier formato que Date pueda parsear
  if (typeof dateValue === 'string')
    return Timestamp.fromDate(new Date(dateValue));

  // Si es un objeto dayjs (verificar propiedad común de dayjs)
  if (dateValue.$d) return Timestamp.fromDate(dateValue.$d);

  return null;
};

export const addInsuranceAuth = async (user, authData, clientId) => {
  try {
    const authsCollection = getInsuranceAuthsCollection();

    if (!authsCollection) {
      console.warn(
        'No se pudo agregar autorización: datos de usuario no disponibles',
      );
      return null;
    }

    // Format the auth data with proper date formatting
    const formattedAuthData = {
      ...authData,
      birthDate: toFirestoreTimestamp(authData.birthDate),
      indicationDate: toFirestoreTimestamp(authData.indicationDate),
    };

    const { insuranceId, authNumber } = authData || {};

    const existingAuths = await searchInsuranceAuthGlobally(
      insuranceId,
      authNumber,
    );

    if (existingAuths.length > 0) {
      throw new Error(
        'Ya existe una autorización con el mismo número para esta aseguradora',
      );
    }

    const id = nanoid();
    const newDocRef = doc(authsCollection, id);

    await setDoc(newDocRef, {
      businessId: user.businessID,
      id, // Se guarda el ID generado en el documento
      userId: user.uid, // Asocia la autorización al usuario
      clientId, // Asocia la autorización con el cliente actual
      ...formattedAuthData,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      status: 'active',
      updatedAt: serverTimestamp(),
      deleted: false,
    });

    // New authorization created successfully
    return id;
  } catch (error) {
    console.error('Error adding/updating insurance authorization:', error);
    throw error;
  }
};

/**
 * Updates the details of an insurance authorization using setDoc with merge option.
 * Adds/updates audit fields such as updatedAt and updatedBy using user.uid.
 *
 * @param {object} user - The user object with businessID and uid.
 * @param {string} authId - The ID of the authorization to update.
 * @param {object} updatedData - The data fields to update.
 */
export const updateInsuranceAuth = async (user, authId, updatedData) => {
  try {
    const authsCollection = getInsuranceAuthsCollection();
    if (!authsCollection) {
      console.warn(
        'No se pudo actualizar autorización: datos de usuario no disponibles',
      );
      return;
    }

    const authDoc = doc(authsCollection, authId);
    const updateTime = new Date().toISOString();

    // Ensure dates are properly formatted
    const formattedUpdatedData = {
      ...updatedData,
    };

    // Check if dates are already ISO strings or need conversion
    if (
      formattedUpdatedData.birthDate &&
      typeof formattedUpdatedData.birthDate !== 'string'
    ) {
      formattedUpdatedData.birthDate =
        formattedUpdatedData.birthDate.toISOString();
    }

    if (
      formattedUpdatedData.indicationDate &&
      typeof formattedUpdatedData.indicationDate !== 'string'
    ) {
      formattedUpdatedData.indicationDate =
        formattedUpdatedData.indicationDate.toISOString();
    }

    await setDoc(
      authDoc,
      {
        ...formattedUpdatedData,
        updatedAt: updateTime,
        updatedBy: user.uid,
      },
      { merge: true },
    );
  } catch (error) {
    console.error('Error updating insurance authorization:', error);
    throw error;
  }
};

/**
 * Soft deletes an insurance authorization from the system.
 * Instead of physically deleting the document, it marks it as deleted and sets audit fields.
 *
 * @param {object} user - The user object with businessID and uid.
 * @param {string} authId - The ID of the authorization to soft delete.
 */
export const softDeleteInsuranceAuth = async (user, authId) => {
  try {
    const authsCollection = getInsuranceAuthsCollection();
    if (!authsCollection) {
      console.warn(
        'No se pudo eliminar (soft) autorización: datos de usuario no disponibles',
      );
      return;
    }
    const authDoc = doc(authsCollection, authId);
    const deletedAt = new Date().toISOString();

    await setDoc(
      authDoc,
      {
        deleted: true,
        deletedAt,
        deletedBy: user.uid,
      },
      { merge: true },
    );
  } catch (error) {
    console.error('Error soft deleting insurance authorization:', error);
    throw error;
  }
};

/**
 * Listens to real-time updates of insurance authorizations.
 *
 * @param {object} params - Parameters object.
 * @param {object} params.user - The user object with businessID and uid.
 * @param {string} params.clientId - (Optional) Client ID to filter authorizations.
 * @param {function} params.callback - Function to call with the updated list of authorizations.
 * @param {function} params.errorCallback - (Optional) Function to call if an error occurs.
 * @returns {function} - The unsubscribe function to stop listening.
 */
export const listenInsuranceAuths = ({
  user,
  clientId,
  callback,
  errorCallback,
}) => {
  const authsCollection = getInsuranceAuthsCollection();
  if (!authsCollection) {
    console.warn(
      'No se pudo escuchar autorizaciones: datos de usuario no disponibles',
    );
    // Retornamos una función de no-op para evitar errores en el unsubscribe
    return () => {};
  }

  let queryRef = authsCollection;
  if (clientId) {
    queryRef = query(
      authsCollection,
      where('businessId', '==', user.businessID),
      where('clientId', '==', clientId),
    );
  } else {
    queryRef = query(
      authsCollection,
      where('businessId', '==', user.businessID),
    );
  }

  return onSnapshot(
    queryRef,
    (querySnapshot) => {
      const auths = querySnapshot.docs
        .map((doc) => doc.data())
        .filter((data) => !data.deleted); // Solo devolvemos autorizaciones no eliminadas
      callback(auths);
    },
    errorCallback,
  );
};

/**
 * Custom hook to listen for real-time updates of insurance authorizations.
 *
 * @param {object} user - The user object with businessID and uid.
 * @param {string} clientId - (Optional) Client ID to filter authorizations.
 * @returns {Array} - The current list of active insurance authorizations.
 */
export const useInsuranceAuths = (user, clientId) => {
  const [auths, setAuths] = useState([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenInsuranceAuths({
      user,
      clientId,
      callback: (data) => setAuths(data),
      errorCallback: (error) => {
        console.error('Error listening to insurance authorizations:', error);
      },
    });

    return () => unsubscribe();
  }, [user, clientId]);

  return auths;
};

/**
 * Retrieves the insurance authorization data for a specific client.
 *
 * @param {object} user - The user object with businessID and uid.
 * @param {string} clientId - The ID of the client to fetch authorization for.
 * @returns {Promise<object|null>} - The client's insurance authorization data or null if not found.
 */
export const getInsuranceAuthByClientId = async (user, clientId) => {
  try {
    const authsCollection = getInsuranceAuthsCollection();

    if (!authsCollection) {
      console.warn(
        'No se pudo obtener autorización: datos de usuario no disponibles',
      );
      return null;
    }

    const clientAuthQuery = query(
      authsCollection,
      where('businessId', '==', user.businessID),
      where('clientId', '==', clientId),
      where('deleted', '==', false),
    );

    const querySnapshot = await getDocs(clientAuthQuery);

    if (querySnapshot.empty) {
      // No insurance authorization found for client
      return null;
    }

    // Return the first active insurance authorization found
    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error('Error fetching insurance authorization:', error);
    throw error;
  }
};

/**
 * Searches for insurance authorizations globally without requiring user.businessID.
 *
 * @param {string} clientId - The ID of the client to search for.
 * @returns {Promise<Array>} - The list of insurance authorizations found.
 */
export const searchInsuranceAuthGlobally = async (insuranceId, authNumber) => {
  const authsCollection = getInsuranceAuthsCollection();
  const globalQuery = query(
    authsCollection,
    where('authNumber', '==', authNumber),
    where('insuranceId', '==', insuranceId),
    where('deleted', '==', false),
  );
  const snapshot = await getDocs(globalQuery);
  if (snapshot.empty) return [];
  return snapshot.docs.map((doc) => doc.data());
};
