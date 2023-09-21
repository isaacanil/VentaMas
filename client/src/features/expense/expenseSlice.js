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

export const expenseSlice = createSlice({
    name: 'expense',
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

export const { setExpense,  resetExpense, setExpenseMode } = expenseSlice.actions;
export default expenseSlice.reducer;

export const selectExpense = state => state.expense;
