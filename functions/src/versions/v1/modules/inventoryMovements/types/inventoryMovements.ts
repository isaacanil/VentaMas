import { AuditInfo } from './AuditInfo.js';

export enum MovementType {
  Entry = 'in',
  Exit = 'out',
}

export enum MovementReason {
  Sale = 'sale',
  Purchase = 'purchase',
  Adjustment = 'adjustment',
  Return = 'return',
  InitialStock = 'initial_stock',
  Damaged = 'damaged',
  Expired = 'expired',
  Lost = 'lost',
  Transfer = 'transfer',
  BackOrder = 'backorder',
}

export interface InventoryMovement extends AuditInfo {
  id: string;
  productId: string;
  productName: string;
  productStockId: string;
  batchId?: string;
  movementType: MovementType;
  movementReason: MovementReason;
  quantity: number;
  notes?: string;
}
