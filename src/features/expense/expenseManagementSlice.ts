import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Expense {
  description: string;
  amount: number;
  dates: {
    expenseDate: number;
    createdAt: string;
  };
  receiptImageUrl: string;
  category: string;
  categoryId: string;
  invoice: any;
  payment: any;
  attachments: any[];
}

interface ExpenseManagementState {
  mode: string;
  expense: Expense;
}

interface ExpenseManagementRootState {
  expenseManagement: ExpenseManagementState;
}

const initialState: ExpenseManagementState = {
  mode: 'add',
  expense: {
    description: '',
    amount: 0,
    dates: {
      expenseDate: Date.now(),
      createdAt: '',
    },
    receiptImageUrl: '',
    category: '', // Nombre de la categoría
    categoryId: '', // ID de la categoría
    invoice: {},
    payment: {},
    attachments: [],
  },
};

export const expenseManagementSlice = createSlice({
  name: 'expenseManagement',
  initialState,
  reducers: {
    setExpense: (
      state: ExpenseManagementState,
      { payload }: PayloadAction<Partial<Expense>>,
    ) => {
      state.expense = {
        ...state.expense,
        ...payload,
        dates: { ...state.expense.dates, ...payload.dates },
        invoice: { ...state.expense.invoice, ...payload.invoice },
        payment: { ...state.expense.payment, ...payload.payment },
        attachments: payload.attachments ?? state.expense.attachments,
      };
    },
    resetExpense: (state: ExpenseManagementState) => {
      state.expense = initialState.expense;
      state.mode = initialState.mode;
    },
    setExpenseMode: (
      state: ExpenseManagementState,
      action: PayloadAction<string>,
    ) => {
      state.mode = action.payload;
    },
  },
});

export const { setExpense, resetExpense, setExpenseMode } =
  expenseManagementSlice.actions;
export default expenseManagementSlice.reducer;

export const selectExpense = (state: ExpenseManagementRootState) =>
  state.expenseManagement;
