// @ts-nocheck
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useState, useEffect } from 'react';

import { db } from '@/firebase/firebaseconfig';

/**
 * Retorna la referencia a la colección "insuranceBeneficiaries" dentro del negocio.
 * La ruta es: businesses/{user.businessID}/insuranceBeneficiaries
 *
 * @param {object} user - Objeto usuario que contiene businessID y uid.
 * @returns {CollectionReference} - Referencia a la colección.
 */
const getInsuranceBeneficiariesCollection = (user) => {
  if (!user || !user.businessID) {
    console.warn('Usuario o businessID no disponible aún');
    return null;
  }
  return collection(
    db,
    'businesses',
    user.businessID,
    'insuranceBeneficiaries',
  );
};

/**
 * Adds an insurance beneficiary to the system using setDoc.
 * Generates a custom ID using nanoid and sets audit fields using user.uid.
 *
 * @param {object} user - The user object with businessID and uid.
 * @param {object} beneficiaryData - The data of the insurance beneficiary.
 * @param {string} clientId - The ID of the client to associate with the beneficiary.
 * @returns {Promise<string>} - The generated ID of the newly added beneficiary.
 */
export const addInsuranceBeneficiary = async (
  user,
  beneficiaryData,
  clientId,
) => {
  try {
    const id = nanoid();
    const createdAt = new Date().toISOString();
    const beneficiariesCollection = getInsuranceBeneficiariesCollection(user);
    if (!beneficiariesCollection) {
      console.warn(
        'No se pudo agregar beneficiario: datos de usuario no disponibles',
      );
      return null;
    }
    const newDocRef = doc(beneficiariesCollection, id);

    await setDoc(newDocRef, {
      id, // Se guarda el ID generado en el documento
      userId: user.uid, // Asocia el beneficiario al usuario (titular)
      clientId, // Asocia el beneficiario con el cliente actual
      ...beneficiaryData,
      createdBy: user.uid, // Usamos user.uid directamente
      createdAt,
      updatedAt: createdAt,
      deleted: false,
    });

    return id;
  } catch (error) {
    console.error('Error adding insurance beneficiary:', error);
    throw error;
  }
};

/**
 * Updates the details of an insurance beneficiary using setDoc with merge option.
 * Adds/updates audit fields such as updatedAt and updatedBy using user.uid.
 *
 * @param {object} user - The user object with businessID and uid.
 * @param {string} beneficiaryId - The ID of the beneficiary to update.
 * @param {object} updatedData - The data fields to update.
 */
export const updateInsuranceBeneficiary = async (
  user,
  beneficiaryId,
  updatedData,
) => {
  try {
    const beneficiariesCollection = getInsuranceBeneficiariesCollection(user);
    if (!beneficiariesCollection) {
      console.warn(
        'No se pudo actualizar beneficiario: datos de usuario no disponibles',
      );
      return;
    }
    const beneficiaryDoc = doc(beneficiariesCollection, beneficiaryId);
    const updateTime = new Date().toISOString();

    await setDoc(
      beneficiaryDoc,
      {
        ...updatedData,
        updatedAt: updateTime,
        updatedBy: user.uid, // Usamos user.uid directamente
      },
      { merge: true },
    );
  } catch (error) {
    console.error('Error updating insurance beneficiary:', error);
    throw error;
  }
};

/**
 * Soft deletes an insurance beneficiary from the system.
 * Instead of physically deleting the document, it marks it as deleted and sets audit fields.
 *
 * @param {object} user - The user object with businessID and uid.
 * @param {string} beneficiaryId - The ID of the beneficiary to soft delete.
 */
export const softDeleteInsuranceBeneficiary = async (user, beneficiaryId) => {
  try {
    const beneficiariesCollection = getInsuranceBeneficiariesCollection(user);
    if (!beneficiariesCollection) {
      console.warn(
        'No se pudo eliminar (soft) beneficiario: datos de usuario no disponibles',
      );
      return;
    }
    const beneficiaryDoc = doc(beneficiariesCollection, beneficiaryId);
    const deletedAt = new Date().toISOString();

    await setDoc(
      beneficiaryDoc,
      {
        deleted: true,
        deletedAt,
        deletedBy: user.uid, // Usamos user.uid para marcar quien realiza la eliminación
      },
      { merge: true },
    );
  } catch (error) {
    console.error('Error soft deleting insurance beneficiary:', error);
    throw error;
  }
};

/**
 * Listens to real-time updates of insurance beneficiaries in the given business.
 *
 * @param {object} user - The user object with businessID and uid.
 * @param {function} callback - Function to call with the updated list of beneficiaries.
 * @param {function} errorCallback - (Optional) Function to call if an error occurs.
 * @returns {function} - The unsubscribe function to stop listening.
 */
export const listenInsuranceBeneficiaries = ({
  user,
  clientId,
  callback,
  errorCallback,
}) => {
  const beneficiariesCollection = getInsuranceBeneficiariesCollection(user);
  if (!beneficiariesCollection) {
    console.warn(
      'No se pudo escuchar beneficiarios: datos de usuario no disponibles',
    );
    return undefined;
  }
  let queryRef = beneficiariesCollection;
  if (clientId) {
    queryRef = query(
      beneficiariesCollection,
      where('clientId', '==', clientId),
    );
  }
  return onSnapshot(
    queryRef,
    (querySnapshot) => {
      const beneficiaries = querySnapshot.docs
        .map((doc) => doc.data())
        .filter((data) => !data.deleted); // Filtrar solo los beneficiarios no eliminados
      callback(beneficiaries);
    },
    errorCallback,
  );
};

/**
 * Custom hook to listen for real-time updates of insurance beneficiaries.
 *
 * @param {object} user - The user object with businessID and uid.
 * @returns {Array} - The current list of active insurance beneficiaries.
 */
export const useInsuranceBeneficiaries = (user, clientId) => {
  const [beneficiaries, setBeneficiaries] = useState([]);

  if (!user && beneficiaries.length > 0) {
    setBeneficiaries([]);
  }

  useEffect(() => {
    if (!user) {
      return undefined;
    }
    const unsubscribe = listenInsuranceBeneficiaries({
      user,
      clientId,
      callback: (data) => setBeneficiaries(data),
      errorCallback: (error) => {
        console.error('Error listening to insurance beneficiaries:', error);
      },
    });
    return () => unsubscribe();
  }, [user, clientId]);

  return beneficiaries;
};
