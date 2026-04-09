import { collection, doc, writeBatch } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

const BATCH_SIZE = 500;

type RncRecord = Record<string, unknown>;

export const fbAddRncData = async (rncData: RncRecord[]): Promise<void> => {
  if (!rncData || rncData.length === 0) return;

  for (let i = 0; i < rncData.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const end = Math.min(i + BATCH_SIZE, rncData.length);

    for (let j = i; j < end; j++) {
      const docRef = doc(collection(db, 'rncData')); // Genera un nuevo documento con ID unico
      batch.set(docRef, rncData[j]);
    }

    // Sube el lote actual
    await batch.commit();

    // Opcional: Mostrar progreso
  }
};
