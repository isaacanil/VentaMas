import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
  type QuerySnapshot,
  type Transaction,
} from 'firebase/firestore';
import type { UpdateData } from '@firebase/firestore-types';

import { db } from './firebaseconfig';

// Funcion para leer datos de Firestore
export async function fbGetDocs<T = DocumentData>(
  refOrQuery: Query<T> | CollectionReference<T>,
  transaction: Transaction | null = null,
): Promise<QuerySnapshot<T>> {
  try {
    if (transaction) {
      // Las transacciones no soportan lecturas de queries/collections.
      return await getDocs(refOrQuery);
    }
    return await getDocs(refOrQuery);
  } catch (error) {
    console.error('Error al leer datos de Firestore: ', error);
    throw error;
  }
}

export async function fbReadData<T = DocumentData>(
  refOrQuery: Query<T> | CollectionReference<T>,
  transaction: Transaction | null = null,
): Promise<QuerySnapshot<T>> {
  try {
    if (transaction) {
      // Las transacciones no soportan lecturas de queries/collections.
      return await getDocs(refOrQuery);
    }
    return await getDocs(refOrQuery);
  } catch (error) {
    console.error('Error al leer datos de Firestore: ', error);
    throw error;
  }
}

export async function fbGetDoc<T = DocumentData>(
  refOrQuery: DocumentReference<T>,
  transaction: Transaction | null = null,
): Promise<DocumentSnapshot<T>> {
  try {
    return transaction
      ? await transaction.get(refOrQuery)
      : await getDoc(refOrQuery);
  } catch (error) {
    console.error('Error al leer datos de Firestore: ', error);
    throw error;
  }
}

export const getDocRef = (...segments: [string, ...string[]]) => {
  return doc(db, ...segments);
};

// Function to get a collection reference using destructured array segments
export const getCollectionRef = (...segments: [string, ...string[]]) => {
  return collection(db, ...segments);
};

// Funcion para escribir datos en Firestore
export async function fbSetDoc<T = DocumentData>(
  ref: DocumentReference<T, T>,
  data: T,
  transaction: Transaction | null = null,
): Promise<void> {
  try {
    if (transaction) {
      transaction.set(ref, data);
      return;
    }
    await setDoc(ref, data);
  } catch (error) {
    console.error('Error al escribir datos en Firestore: ', error);
    throw error;
  }
}

// Funcion para actualizar datos en Firestore
export async function fbUpdateDoc<T = DocumentData>(
  ref: DocumentReference<T, T>,
  data: UpdateData,
  transaction: Transaction | null = null,
): Promise<void> {
  try {
    if (transaction) {
      transaction.update(ref, data);
      return;
    }
    await updateDoc(ref, data);
  } catch (error) {
    console.error('Error al actualizar datos en Firestore: ', error);
    throw error;
  }
}

// Funcion para eliminar datos de Firestore
export async function fbDeleteDoc(
  ref: DocumentReference,
  transaction: Transaction | null = null,
): Promise<void> {
  try {
    if (transaction) {
      transaction.delete(ref);
      return;
    }
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error al eliminar datos de Firestore: ', error);
    throw error;
  }
}

export default { fbGetDocs, fbGetDoc, fbSetDoc, fbUpdateDoc, fbDeleteDoc };
