import { collection, query, getDocs, deleteDoc } from "firebase/firestore";

import { db } from "../firebaseconfig";

// Valor por defecto de sequence (ajústalo según tu lógica)
const DEFAULT_SEQUENCE = "0000000000";

export const removeDuplicateTaxReceipts = async (businessID) => {
  try {
    const taxReceiptsRef = collection(db, "businesses", businessID, "taxReceipts");
    const q = query(taxReceiptsRef);
    const querySnapshot = await getDocs(q);

    // Agrupar recibos por serie
    const receiptsBySeries = {};
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data().data;
      const serie = data.serie;
      if (!receiptsBySeries[serie]) {
        receiptsBySeries[serie] = [];
      }
      receiptsBySeries[serie].push({
        id: docSnap.id,
        ...data,
        docRef: docSnap.ref
      });
    });

    // Iterar sobre cada grupo de la misma serie
    for (const serie in receiptsBySeries) {
      const receipts = receiptsBySeries[serie];

      // Si hay más de un documento con la misma serie, se procede a revisar duplicados
      if (receipts.length > 1) {
        let receiptToKeep = null;

        // 1. Priorizar recibos con sequence "consumido" (diferente al default)
        const consumedReceipts = receipts.filter(r => r.sequence !== DEFAULT_SEQUENCE);
        if (consumedReceipts.length > 0) {
          // Por ejemplo, conservar el que tenga el createdAt más antiguo (o el más reciente, según necesidad)
          receiptToKeep = consumedReceipts.reduce((prev, current) => {
            // Si alguno no tiene createdAt, se prioriza el que sí lo tenga
            if (!prev.createdAt) return current;
            if (!current.createdAt) return prev;
            return prev.createdAt.toMillis() < current.createdAt.toMillis() ? prev : current;
          });
        } else {
          // 2. Si ninguno tiene un sequence "consumido", usar la fecha de creación
          if (receipts.every(r => r.createdAt)) {
            receiptToKeep = receipts.reduce((prev, current) => {
              return prev.createdAt.toMillis() < current.createdAt.toMillis() ? prev : current;
            });
          } else {
            // 3. Fallback: usar el primer documento
            receiptToKeep = receipts[0];
          }
        }

        // 4. (Opcional) Verificar que no se repita el name de forma secundaria.
        // Si existen varios con el mismo name y serie, podrías filtrar para quedarte con uno.
        // Por ejemplo, si hay otros con name igual a receiptToKeep.name, se eliminarán.
        const sameNameDuplicates = receipts.filter(r => r.name === receiptToKeep.name);
        if (sameNameDuplicates.length > 1) {
          // En este ejemplo se conserva receiptToKeep y se eliminan los demás
          sameNameDuplicates.forEach(r => {
            if (r.id !== receiptToKeep.id) {
              deleteDoc(r.docRef)
                .then(() => console.log(`Eliminado duplicado (name) con id: ${r.id}`))
                .catch(err => console.error("Error eliminando duplicado:", err));
            }
          });
        } else {
          // Eliminar el resto de los duplicados de esta serie
          receipts.forEach(async r => {
            if (r.id !== receiptToKeep.id) {
              await deleteDoc(r.docRef);
              console.log(`Eliminado duplicado con id: ${r.id} para la serie: ${serie}`);
            }
          });
        }
      }
    }
  } catch (err) {
    console.error("Error al eliminar duplicados:", err);
  }
};
