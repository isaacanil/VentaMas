import { AuditInfo } from "./AuditInfo";

export interface Batch {
    id: string; // auto-generated
    productId: string; // Referencia al Producto
    shortName: string; // Nombre corto del lote
    batchNumber: string; // Número de lote
    manufacturingDate?: Date; // Fecha de fabricación del lote
    expirationDate?: Date; // Fecha de expiración del lote (opcional)
    status: 'active' | 'inactive'; // Estado del lote
    location: {
      warehouseId: string; // Referencia al Almacén
      shelfId: string; // Referencia al Estante
      rowShelfId: string; // Referencia a la Fila
      segmentId: string; // Referencia al Segmento
      locationCode: string; // Código de la ubicación
    }
    receivedDate: Date; // Fecha de recepción del lote
    // supplierId: string; // Referencia al Proveedor
    notes?: string; // Notas del lote
    count: number; // Cantidad total de productos en el lote
    audit: AuditInfo; // Objeto de auditoría
  }
  