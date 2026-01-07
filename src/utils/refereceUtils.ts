// @ts-nocheck
import { doc, getDoc, DocumentReference } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

// Verifica si un valor es una referencia de documento
export const isReference = (value) => value instanceof DocumentReference;

// Crea una referencia si no lo es ya
export const createReference = (collectionPath, field) => {
  if (isReference(field)) {
    return field;
  }
  return doc(db, ...collectionPath, field);
};

// Obtiene un documento desde una referencia
export const getDocFromRef = async (ref) => {
  try {
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      return snapshot.data(); // Devuelve los datos del documento
    } else {
      console.warn('El documento no existe:', ref.path);
      return null; // Documento no encontrado
    }
  } catch (error) {
    console.error('Error al obtener el documento:', error);
    return null; // Manejo de errores
  }
};
