import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  modals: {
    chartExpenseModal: {
      isOpen: false,
    },
    expenseFormModal: {
      isOpen: false,
    },
    // ... otros modales o UI relacionados con gastos
  },
};

export const expenseUISlice = createSlice({
  name: 'expenseUI',
  initialState,
  reducers: {
    toggleExpenseChartModal: (state) => {
      state.modals.chartExpenseModal.isOpen =
        !state.modals.chartExpenseModal.isOpen;
    },
    toggleExpenseFormModal: (state) => {
      state.modals.expenseFormModal.isOpen =
        !state.modals.expenseFormModal.isOpen;
    },
    openExpenseFormModal: (state) => {
      state.modals.expenseFormModal.isOpen = true;
    },
    closeExpenseFormModal: (state) => {
      state.modals.expenseFormModal.isOpen = false;
    },
    // ... otras acciones relacionadas con la UI
  },
});

export const {
  toggleExpenseChartModal,
  toggleExpenseFormModal,
  openExpenseFormModal,
  closeExpenseFormModal,
} = expenseUISlice.actions;

export default expenseUISlice.reducer;

export const selectExpenseChartModal = (state) =>
  state.expenseUI.modals.chartExpenseModal;
export const selectExpenseFormModal = (state) =>
  state.expenseUI.modals.expenseFormModal;
