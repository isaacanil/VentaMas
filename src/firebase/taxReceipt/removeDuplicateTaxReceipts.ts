import { collection, query, getDocs, deleteDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { TaxReceiptData, TaxReceiptDocument } from '@/types/taxReceipt';
import type { TimestampLike } from '@/utils/date/types';

// Valor por defecto de sequence (ajústalo según tu lógica)
const DEFAULT_SEQUENCE = '0000000000';

type ReceiptWithMeta = TaxReceiptData & {
  id: string;
  docRef: Parameters<typeof deleteDoc>[0];
  createdAt?: TimestampLike;
};

const toMillisSafe = (value: TimestampLike): number | null => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return null;
};

export const removeDuplicateTaxReceipts = async (businessID: string) => {
  try {
    const taxReceiptsRef = collection(
      db,
      'businesses',
      businessID,
      'taxReceipts',
    );
    const q = query(taxReceiptsRef);
    const querySnapshot = await getDocs(q);

    // Agrupar recibos por serie
    const receiptsBySeries: Record<string, ReceiptWithMeta[]> = {};
    querySnapshot.forEach((docSnap) => {
      const data = (docSnap.data() as TaxReceiptDocument)?.data;
      const serie = data?.serie || data?.series || 'unknown';
      if (!receiptsBySeries[serie]) {
        receiptsBySeries[serie] = [];
      }
      receiptsBySeries[serie].push({
        id: docSnap.id,
        ...data,
        docRef: docSnap.ref as Parameters<typeof deleteDoc>[0],
      });
    });

    // Iterar sobre cada grupo de la misma serie
    for (const serie in receiptsBySeries) {
      const receipts = receiptsBySeries[serie];

      // Si hay más de un documento con la misma serie, se procede a revisar duplicados
      if (receipts.length > 1) {
        let receiptToKeep: ReceiptWithMeta | null = null;

        // 1. Priorizar recibos con sequence "consumido" (diferente al default)
        const consumedReceipts = receipts.filter(
          (r) => r.sequence !== DEFAULT_SEQUENCE,
        );
        if (consumedReceipts.length > 0) {
          // Por ejemplo, conservar el que tenga el createdAt más antiguo (o el más reciente, según necesidad)
          receiptToKeep = consumedReceipts.reduce((prev, current) => {
            // Si alguno no tiene createdAt, se prioriza el que sí lo tenga
            if (!prev.createdAt) return current;
            if (!current.createdAt) return prev;
            const prevMillis = toMillisSafe(prev.createdAt) ?? 0;
            const currentMillis = toMillisSafe(current.createdAt) ?? 0;
            return prevMillis < currentMillis ? prev : current;
          });
        } else {
          // 2. Si ninguno tiene un sequence "consumido", usar la fecha de creación
          if (receipts.every((r) => r.createdAt)) {
            receiptToKeep = receipts.reduce((prev, current) => {
              const prevMillis = toMillisSafe(prev.createdAt) ?? 0;
              const currentMillis = toMillisSafe(current.createdAt) ?? 0;
              return prevMillis < currentMillis ? prev : current;
            });
          } else {
            // 3. Fallback: usar el primer documento
            receiptToKeep = receipts[0];
          }
        }

        // 4. (Opcional) Verificar que no se repita el name de forma secundaria.
        // Si existen varios con el mismo name y serie, podrías filtrar para quedarte con uno.
        // Por ejemplo, si hay otros con name igual a receiptToKeep.name, se eliminarán.
        const sameNameDuplicates = receipts.filter(
          (r) => r.name === receiptToKeep?.name,
        );
        if (sameNameDuplicates.length > 1 && receiptToKeep) {
          // En este ejemplo se conserva receiptToKeep y se eliminan los demás
          sameNameDuplicates.forEach((r) => {
            if (r.id !== receiptToKeep.id) {
              deleteDoc(r.docRef)
                .then(() =>
                  console.log(`Eliminado duplicado (name) con id: ${r.id}`),
                )
                .catch((err) =>
                  console.error('Error eliminando duplicado:', err),
                );
            }
          });
        } else {
          // Eliminar el resto de los duplicados de esta serie
          receipts.forEach(async (r) => {
            if (r.id !== receiptToKeep?.id) {
              await deleteDoc(r.docRef);
              console.log(
                `Eliminado duplicado con id: ${r.id} para la serie: ${serie}`,
              );
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('Error al eliminar duplicados:', err);
  }
};
