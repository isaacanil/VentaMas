import { NCF_TYPES } from '../config/ncfTypes.js';
import { _generateNfcTx } from '../utils/rncUtils.js';

/**
 * Función de servicio para generar el comprobante fiscal.
 *
 * @param {Object} params - Objeto con los siguientes atributos:
 *   - {Object} user: Objeto de usuario (debe incluir businessID).
 *   - {boolean} taxReceiptEnabled: Indica si la generación del comprobante está habilitada.
 *   - {string} ncfType: Tipo de NCF a generar (se resuelve a partir de NCF_TYPES).
 *   - {Object} [transaction=null]: Objeto de transacción para operaciones atómicas.
 *   - {any} [extraValue=null]: Valor extra para la generación del NCF.
 *
 * @returns {Promise<string|null>} - Código NCF generado o null en caso de error o incumplimiento de validaciones.
 */

interface GenerateTaxReceiptParams {
  user: { businessID: string; uid: string }; // Define a more specific type if possible
  taxReceiptEnabled: boolean;
  ncfType: string;
  transaction?: any | null; // Define a more specific type if possible
  extraValue?: any | null; // Define a more specific type if possible
}

export const generateTaxReceipt = async ({
  user,
  taxReceiptEnabled,
  ncfType,
  transaction = null,
  extraValue = null,
}: GenerateTaxReceiptParams): Promise<string | null> => {
  if (!taxReceiptEnabled) return null;
  if (!user || !NCF_TYPES[ncfType]) return null;

  try {
    return await _generateNfcTx(
      user,
      NCF_TYPES[ncfType],
      transaction,
      extraValue,
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        `Error procesando el comprobante fiscal para el tipo ${ncfType}:`,
        error.message,
      );
      throw new Error('Error al procesar el comprobante fiscal');
    } else {
      console.error(
        `Error procesando el comprobante fiscal para el tipo ${ncfType}:`,
        error,
      );
      throw new Error('Error desconocido al procesar el comprobante fiscal');
    }
  }
};
