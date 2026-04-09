import { doc, getDoc } from 'firebase/firestore';
import type { DocumentReference, DocumentData } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

// Verifica si un valor es una referencia de documento
export const isReference = (value: unknown): value is DocumentReference => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as DocumentReference;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.path === 'string' &&
    typeof candidate.parent === 'object'
  );
};

// Crea una referencia si no lo es ya
export const createReference = (
  collectionPath: string[],
  field: string | DocumentReference,
): DocumentReference<DocumentData> => {
  if (isReference(field)) {
    return field;
  }
  const path = [...collectionPath, field].join('/');
  return doc(db, path);
};

// Obtiene un documento desde una referencia
export const getDocFromRef = async <T = DocumentData>(
  ref: DocumentReference<T>,
): Promise<T | null> => {
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
