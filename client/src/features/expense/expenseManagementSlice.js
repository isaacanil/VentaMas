import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    mode: 'add',
    expense: {
        description: '',
        amount: 0,
        dates: {
            expenseDate: '',
            createdAt: '',
        },
        receiptImageUrl: '',
        category: "",
    },
};

export const expenseManagementSlice = createSlice({
    name: 'expenseManagement',
    initialState,
    reducers: {
        setExpense: (state, action) => {
            state.expense = { ...state.expense, ...action.payload };
        },
        resetExpense: state => {
            state.expense = initialState.expense;
            state.mode = initialState.mode;
        },
        setExpenseMode: (state, action) => {
            state.mode = action.payload;
        }
    }
});

export const { setExpense,  resetExpense, setExpenseMode } = expenseManagementSlice.actions;
export default expenseManagementSlice.reducer;

export const selectExpense = state => state.expenseManagement;
