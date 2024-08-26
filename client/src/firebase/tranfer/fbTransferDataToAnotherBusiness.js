import { transferProducts } from "./fbTransferProducts";
import { transferProductCategories } from "./fbTransferProductCategories";
import { transferClients } from "./fbTransferClients";


/**
 * Transfiere productos y categorías de un negocio a otro.
 * 
 * @param {string} businessIdA - ID del negocio de origen.
 * @param {string} businessIdB - ID del negocio de destino.
 * @param {number} [limit=0] - Cantidad de productos a transferir (0 para todos los productos).
 */
export const fbTransferDataToAnotherBusiness = async (businessIdA, businessIdB, limit = 0) => {
    try {
        await transferProducts(businessIdA, businessIdB, limit);
        console.log("Productos Transferidos")
        await transferProductCategories(businessIdA, businessIdB, limit);
        console.log("Categorias Transferidos")
        await transferClients(businessIdA, businessIdB, limit);
        console.log("Clientes Transferidos")
    } catch (error) {
        console.error(`Error transfiriendo productos y categorías de negocio origen (${businessIdA}) a negocio destino (${businessIdB}):`, error);
    }
};
