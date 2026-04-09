import { createSlice } from '@reduxjs/toolkit';

interface ModalState {
  isOpen: boolean;
}

interface PurchaseUIState {
  modals: {
    chartPurchaseModal: ModalState;
  };
}

interface PurchaseUIRootState {
  purchaseUI: PurchaseUIState;
}

const initialState: PurchaseUIState = {
  modals: {
    chartPurchaseModal: {
      isOpen: false,
    },
    // ... otros modales o UI relacionados con gastos
  },
};

export const purchaseUISlice = createSlice({
  name: 'purchaseUI',
  initialState,
  reducers: {
    togglePurchaseChartModal: (state: PurchaseUIState) => {
      state.modals.chartPurchaseModal.isOpen =
        !state.modals.chartPurchaseModal.isOpen;
    },
    // ... otras acciones relacionadas con la UI
  },
});

export const { togglePurchaseChartModal } = purchaseUISlice.actions;
export default purchaseUISlice.reducer;

export const selectPurchaseChartModal = (state: PurchaseUIRootState) =>
  state.purchaseUI.modals.chartPurchaseModal;
