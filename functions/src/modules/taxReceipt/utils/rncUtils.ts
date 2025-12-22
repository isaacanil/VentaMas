import { db, admin } from '../../../core/config/firebase.js';
import { generateNCFCode, ReceiptData } from './generateNCFCode.js';

/**
 * Función privada que genera y actualiza el NCF utilizando una transacción (si se pasa).
 *
 * @param {Object} user - Objeto que debe incluir la propiedad businessID.
 * @param {string} taxReceiptName - Nombre del comprobante fiscal (NCF) a buscar.
 * @param {Object} [transaction=null] - Objeto de transacción, si se requiere.
 * @param {any} [extraValue=null] - Valor extra para la generación del NCF.
 *
 * @returns {Promise<string|null>} - Código NCF generado o null si no se encuentra o se produce algún error.
 */
// Define interfaces for better type safety
interface User {
  businessID: string;
  // Add other user properties if known
}

/**
 * Función privada que genera y actualiza el NCF utilizando una transacción (si se pasa).
 *
 * @param {User} user - Objeto que debe incluir la propiedad businessID.
 * @param {string} taxReceiptName - Nombre del comprobante fiscal (NCF) a buscar.
 * @param {FirebaseFirestore.Transaction | null} [transaction=null] - Objeto de transacción, si se requiere.
 * @param {any | null} [extraValue=null] - Valor extra para la generación del NCF.
 *
 * @returns {Promise<string|null>} - Código NCF generado o null si no se encuentra o se produce algún error.
 */
export const _generateNfcTx = async (
  user: User,
  taxReceiptName: string,
  transaction: admin.firestore.Transaction | null = null,
  extraValue: any | null = null, // Kept as any as its usage isn't defined here
): Promise<string | null> => {
  // Se obtiene la colección de comprobantes fiscales para el negocio del usuario
  const taxReceiptRef: admin.firestore.CollectionReference = db
    .collection('businesses')
    .doc(user.businessID)
    .collection('taxReceipts');

  try {
    // Se filtra por el nombre del comprobante fiscal
    const querySnapshot: admin.firestore.QuerySnapshot = await taxReceiptRef
      .where('data.name', '==', taxReceiptName)
      .get();
    if (querySnapshot.empty) {
      console.log('Comprobante fiscal no encontrado');
      return null;
    }
    // Procesamos el primer documento encontrado
    for (const docSnapshot of querySnapshot.docs) {
      const taxReceiptData = docSnapshot.data() as ReceiptData; // Cast to ReceiptData
      const { ncfCode, updatedData } = generateNCFCode(taxReceiptData);

      // Actualiza el documento utilizando la transacción si se ha pasado
      if (transaction) {
        transaction.update(docSnapshot.ref, { data: updatedData });
      } else {
        await docSnapshot.ref.update({ data: updatedData });
      }
      return ncfCode;
    }
    // Added explicit return null in case the loop doesn't execute (though querySnapshot.empty check should prevent this)
    return null;
  } catch (error) {
    console.error('Error actualizando el comprobante fiscal:', error);
    return null;
  }
};
