import { Timestamp } from "firebase/firestore";
import type { AuditInfo } from "./AuditInfo";
/**
 * Interface ProductStock
 * 
 * Representa la información de stock de un producto en el almacén.
 * 
 * @property id - Identificador auto-generado.
 * @property batchId - Referencia al lote del producto.
 * @property location - Ubicación del producto con la siguiente estructura: "warehouseId/shelfId/rowId/segmentId".
 * @property productId - Referencia al producto.
 * @property stock - Cantidad de stock del producto en la fila del estante.
 * @property updatedAt - Fecha de última actualización.
 * @property updatedBy - Usuario que realizó la última actualización.
 */
export interface ProductStock extends AuditInfo {
  id: string; 
  batchId: string; 
  location: string;
  productId: string;
  quantity: number; 
  initialQuantity: number;
  updatedAt?: Timestamp; 
  updatedBy?: string; 
}
