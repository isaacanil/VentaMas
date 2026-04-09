import type { AuditInfo } from './AuditInfo';
import type { TimestampLike } from '@/utils/date/types';

export enum BatchStatus {
  Active = 'active',
  Inactive = 'inactive',
  Expired = 'expired',
  Pending = 'pending',
}
export interface Batch extends AuditInfo {
  id: string; // auto-generated
  productId: string; // Referencia al Producto
  shortName: string; // Nombre corto del lote
  batchNumber: string; // Número de lote
  manufacturingDate?: TimestampLike; // Fecha de fabricación del lote
  expirationDate?: TimestampLike; // Fecha de expiración del lote (opcional)
  status: BatchStatus; // Estado del lote
  receivedDate: TimestampLike; // Fecha de recepción del lote
  providerId: string; // Referencia al Proveedor
  notes?: string; // Notas del lote
  quantity: number; // Cantidad total de productos en el lote
  initialQuantity: number; // Cantidad original de productos en el lote
}
