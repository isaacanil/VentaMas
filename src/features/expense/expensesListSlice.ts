import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ExpensesListState {
  expenses: any[];
}

interface ExpensesListRootState {
  expensesList: ExpensesListState;
}

const initialState: ExpensesListState = {
  expenses: [],
};

export const expensesListSlice = createSlice({
  name: 'expensesList',
  initialState,
  reducers: {
    setExpenseList: (
      state: ExpensesListState,
      action: PayloadAction<any[]>,
    ) => {
      state.expenses = action.payload;
    },
    // ... otras acciones relacionadas con la lista de gastos
  },
});

export const { setExpenseList } = expensesListSlice.actions;
export default expensesListSlice.reducer;

export const selectExpenseList = (state: ExpensesListRootState) =>
  state.expensesList.expenses;
