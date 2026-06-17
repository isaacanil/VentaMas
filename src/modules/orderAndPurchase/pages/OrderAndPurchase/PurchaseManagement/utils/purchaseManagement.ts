export {
  hasValidTransactionDate,
  normalizeTransactionMillis,
} from '../../shared/utils/transactionDates';

import type {
  PurchaseManagementLocationState,
  PurchaseManagementUiAction,
  PurchaseManagementUiState,
  PurchaseMode,
} from '../types';

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
