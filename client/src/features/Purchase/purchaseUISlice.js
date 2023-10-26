import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    modals: {
        chartPurchaseModal: {
            isOpen: false,
        }
        // ... otros modales o UI relacionados con gastos
    },
};

export const purchaseUISlice = createSlice({
    name: 'purchaseUI',
    initialState,
    reducers: {
        togglePurchaseChartModal: (state) => {
            state.modals.chartPurchaseModal.isOpen = !state.modals.chartPurchaseModal.isOpen;
        },
        // ... otras acciones relacionadas con la UI
    }
});

export const { togglePurchaseChartModal } = purchaseUISlice.actions;
export default purchaseUISlice.reducer;

export const selectPurchaseChartModal = state => state.purchaseUI.modals.chartPurchaseModal;
