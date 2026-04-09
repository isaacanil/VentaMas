import type { EvidenceFileInput } from '@/components/common/EvidenceUpload/types';
import type { Purchase } from '@/utils/purchase/types';

export type PurchaseMode = 'create' | 'complete' | 'convert' | 'update';

export interface PurchaseManagementLocationState {
  showSummary?: boolean;
  completedPurchase?: Purchase | null;
}

export interface PurchaseManagementUiState {
  completedPurchase: Purchase | null;
  errors: Record<string, boolean>;
  isWarehouseModalOpen: boolean;
  loading: boolean;
  localFiles: EvidenceFileInput[];
  selectedWarehouseId: string | null;
  showSummary: boolean;
}

export type PurchaseManagementUiAction = {
  type: 'patch';
  patch: Partial<PurchaseManagementUiState>;
};

export interface WarehouseOption {
  value: string;
  label: string;
}
