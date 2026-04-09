import { toMillis } from '@/utils/date/toMillis';

import type {
  PurchaseManagementLocationState,
  PurchaseManagementUiAction,
  PurchaseManagementUiState,
  PurchaseMode,
} from '../types';

const MIN_VALID_TRANSACTION_MILLIS = 946684800000; // 2000-01-01T00:00:00.000Z

export const normalizeTransactionMillis = (value: unknown): number | null => {
  const rawMillis = toMillis(value as any);
  if (typeof rawMillis !== 'number' || !Number.isFinite(rawMillis)) {
    return null;
  }

  const normalized = rawMillis < 100_000_000_000 ? rawMillis * 1000 : rawMillis;
  return normalized >= MIN_VALID_TRANSACTION_MILLIS ? normalized : null;
};

export const hasValidTransactionDate = (value: unknown): boolean => {
  return normalizeTransactionMillis(value) !== null;
};

export const createInitialPurchaseManagementUiState = (
  locationState: PurchaseManagementLocationState | null,
): PurchaseManagementUiState => ({
  completedPurchase: locationState?.completedPurchase || null,
  errors: {},
  isWarehouseModalOpen: false,
  loading: false,
  localFiles: [],
  selectedWarehouseId: null,
  showSummary: locationState?.showSummary || false,
});

export const purchaseManagementUiReducer = (
  state: PurchaseManagementUiState,
  action: PurchaseManagementUiAction,
): PurchaseManagementUiState => {
  switch (action.type) {
    case 'patch':
      return {
        ...state,
        ...action.patch,
      };
    default:
      return state;
  }
};

export const getPurchaseManagementSectionName = (mode: PurchaseMode) => {
  switch (mode) {
    case 'create':
      return 'Nueva Compra';
    case 'complete':
      return 'Registrar Recepcion';
    case 'convert':
      return 'Convertir a Compra';
    default:
      return 'Editar Compra';
  }
};
