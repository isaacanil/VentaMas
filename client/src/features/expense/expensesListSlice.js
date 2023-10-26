import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    expenses: []
};

export const expensesListSlice = createSlice({
    name: 'expensesList',
    initialState,
    reducers: {
        setExpenseList: (state, action) => {
            state.expenses = action.payload;
        },
        // ... otras acciones relacionadas con la lista de gastos
    }
});

export const { setExpenseList } = expensesListSlice.actions;
export default expensesListSlice.reducer;

export const selectExpenseList = state => state.expensesList.expenses;
