import type { Dayjs } from 'dayjs';
import type { BackOrder, BackOrderStatus } from '@/models/Warehouse/BackOrder';

export type BackorderSort =
  | 'name-asc'
  | 'name-desc'
  | 'pending-desc'
  | 'pending-asc'
  | 'date-desc'
  | 'date-asc'
  | 'progress-desc'
  | 'progress-asc';

export type BackorderStatusFilter = 'all' | BackOrderStatus;

export type DateRangeValue = [Dayjs | null, Dayjs | null] | null;

export interface BackorderStats {
  total: number;
  pending: number;
  reserved: number;
  completed: number;
}

export interface BackOrderItem extends BackOrder {
  productId?: string | null;
  productName?: string | null;
  status?: BackOrderStatus;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  initialQuantity?: number;
  pendingQuantity?: number;
}

export interface BackorderDateGroup {
  date: Date;
  items: BackOrderItem[];
  totalQuantity: number;
  pendingQuantity: number;
}

export interface BackorderGroup {
  productId: string;
  productName: string;
  totalQuantity: number;
  pendingQuantity: number;
  reservedPendingQuantity: number;
  directPendingQuantity: number;
  lastUpdate: Date;
  progress: number;
  dateGroups: Record<string, BackorderDateGroup>;
}
