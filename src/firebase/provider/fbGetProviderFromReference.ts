import { getDoc, type DocumentReference } from 'firebase/firestore';

export const fbGetDocFromReference = async <T>(
  ref: DocumentReference<T>,
): Promise<T | null> => {
  try {
    const snapshot = await getDoc(ref);
    const doc = snapshot.data();

    if (doc) {
      // Si el documento existe
      return doc; // Retorna el documento
    } else {
      console.warn('No such document!');
      return null; // Retorna nulo si no existe el documento
    }
  } catch (error) {
    // Si hay un error en la promesa
    console.error('Hubo un error al obtener el documento:', error);
    return null; // Retorna nulo en caso de error
  }
};
