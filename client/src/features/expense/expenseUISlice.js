import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    modals: {
        chartExpenseModal: {
            isOpen: false,
        }
        // ... otros modales o UI relacionados con gastos
    },
};

export const expenseUISlice = createSlice({
    name: 'expenseUI',
    initialState,
    reducers: {
        toggleExpenseChartModal: (state) => {
            state.modals.chartExpenseModal.isOpen = !state.modals.chartExpenseModal.isOpen;
        },
        // ... otras acciones relacionadas con la UI
    }
});

export const { toggleExpenseChartModal } = expenseUISlice.actions;
export default expenseUISlice.reducer;

export const selectExpenseChartModal = state => state.expenseUI.modals.chartExpenseModal;
