import { transferClients } from './fbTransferClients';
import { transferProductCategories } from './fbTransferProductCategories';
import { transferProducts } from './fbTransferProducts';

/**
 * Transfiere productos y categorías de un negocio a otro.
 *
 * @param {string} businessIdA - ID del negocio de origen.
 * @param {string} businessIdB - ID del negocio de destino.
 * @param {number} [limit=0] - Cantidad de productos a transferir (0 para todos los productos).
 */
export const fbTransferDataToAnotherBusiness = async (
  businessIdA: string,
  businessIdB: string,
  limit: number = 0,
): Promise<void> => {
  try {
    await transferProducts(businessIdA, businessIdB, limit);
    // Products transferred
    await transferProductCategories(businessIdA, businessIdB, limit);
    // Categories transferred
    await transferClients(businessIdA, businessIdB, limit);
    // Clients transferred
  } catch (error) {
    console.error(
      `Error transfiriendo productos y categorías de negocio origen (${businessIdA}) a negocio destino (${businessIdB}):`,
      error,
    );
  }
};
