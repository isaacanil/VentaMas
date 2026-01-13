import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  mode: 'add',
  expense: {
    description: '',
    amount: 0,
    dates: {
      expenseDate: Date.now(),
      createdAt: '',
    },
    receiptImageUrl: '',
    category: '', // Nombre de la categorÃ­a
    categoryId: '', // ID de la categorÃ­a
  },
};

export const expenseManagementSlice = createSlice({
  name: 'expenseManagement',
  initialState,
  reducers: {
    setExpense: (state, { payload }) => {
      state.expense = {
        ...state.expense,
        ...payload,
        dates: { ...state.expense.dates, ...payload.dates },
        invoice: { ...state.expense.invoice, ...payload.invoice },
        payment: { ...state.expense.payment, ...payload.payment },
        attachments: payload.attachments ?? state.expense.attachments,
      };
    },
    resetExpense: (state: any) => {
      state.expense = initialState.expense;
      state.mode = initialState.mode;
    },
    setExpenseMode: (state: any, action: PayloadAction<any>) => {
      state.mode = action.payload;
    },
  },
});

export const { setExpense, resetExpense, setExpenseMode } =
  expenseManagementSlice.actions;
export default expenseManagementSlice.reducer;

export const selectExpense = (state) => state.expenseManagement;


