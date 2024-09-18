import { Timestamp } from "firebase/firestore";

export interface ProductStock {
  id: string; // auto-generated
  batchId: string; // Referencia al lote del producto
  locationType: 'warehouse' | 'shelf' | 'rowShelf' | 'segment';
  locationId: string; // Referencia a la ubicación del producto
  productId: string; // Referencia al producto
  stock: number; // Cantidad de stock del producto en la fila del estante
  updatedAt?: Timestamp; // Fecha de última actualización
  updatedBy?: string; // Usuario que realizó la última actualización
}
