import { createSlice } from '@reduxjs/toolkit';

interface ModalState {
  isOpen: boolean;
}

interface ExpenseUIState {
  modals: {
    chartExpenseModal: ModalState;
    expenseFormModal: ModalState;
  };
}

interface ExpenseUIRootState {
  expenseUI: ExpenseUIState;
}

const initialState: ExpenseUIState = {
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
    toggleExpenseChartModal: (state: ExpenseUIState) => {
      state.modals.chartExpenseModal.isOpen =
        !state.modals.chartExpenseModal.isOpen;
    },
    toggleExpenseFormModal: (state: ExpenseUIState) => {
      state.modals.expenseFormModal.isOpen =
        !state.modals.expenseFormModal.isOpen;
    },
    openExpenseFormModal: (state: ExpenseUIState) => {
      state.modals.expenseFormModal.isOpen = true;
    },
    closeExpenseFormModal: (state: ExpenseUIState) => {
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

export const selectExpenseChartModal = (state: ExpenseUIRootState) =>
  state.expenseUI.modals.chartExpenseModal;
export const selectExpenseFormModal = (state: ExpenseUIRootState) =>
  state.expenseUI.modals.expenseFormModal;
