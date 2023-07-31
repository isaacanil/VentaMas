import { createSlice } from '@reduxjs/toolkit';
import { initialBanknotes } from './initialBanknotes';

const initialCashBoxStatus = {
    initialized: false,
    employee: null,
    approvalEmployee: null,
    date: null,
    banknotes: initialBanknotes,
    banknotesTotal: 0.0,
    banknotesAmount: 0,
    comments: null
}
const initialCashCount = {
    state: null,
    opening: { ...initialCashBoxStatus },
    closing: { ...initialCashBoxStatus },
    sales: []
}


const cashCountManagementSlice = createSlice({
    name: 'cashCountManagement',
    initialState: {
        state: null,
        opening: { ...initialCashBoxStatus },
        closing: { ...initialCashBoxStatus },
        sales: []
    },
    reducers: {
        setCashCountOpeningBanknotes: (state, action) => {
            state.opening.banknotes = action.payload;
            state.opening.banknotesAmount = calculateTotalAmount(state.opening.banknotes);
            state.opening.banknotesTotal = state.opening.banknotes.reduce((acc, curr) => acc + curr.value * curr.quantity, 0);
        },
        setCashCountOpeningEmployee: (state, action) => {
            state.opening.employee = action.payload;
        },
        setCashCountOpeningDate: (state, action) => {
            state.opening.date = action.payload;
        },
        setCashCountOpeningComments: (state, action) => {
            state.opening.comments = action.payload;
        },
        setCashCountOpening: (state, action) => {
            state.opening = action.payload;
        },
        setCashCountClosingBanknotes: (state, action) => {
            state.closing.banknotes = action.payload;
            state.closing.banknotesAmount = calculateTotalAmount(state.closing.banknotes);
            state.closing.banknotesTotal = state.closing.banknotes.reduce((acc, curr) => acc + curr.value * curr.quantity, 0);
        },
        setCashCountClosingComments: (state, action) => {
            state.closing.comments = action.payload;
        },
        setCashCountSales: (state, action) => {
            state.sales = action.payload;
        },
        setClosingCashTotalAndDiscrepancy: (state, action) => {
            state.closing.totals = action.payload;
        },
        setCashCount: (state, action) => {
            return action.payload;
        },
        clearCashCount: (state) => {
            state.opening = { ...initialCashBoxStatus };
            state.closing = { ...initialCashBoxStatus };
            state.sales = [];
        }
    }
});

function calculateTotalAmount(banknotesByCurrency) {

    let total = banknotesByCurrency.reduce((acc, curr) => acc + curr.quantity, 0);

    return Number(total);
}

export const {
    setCashCountOpening,
    setCashCountOpeningBanknotes,
    setCashCountOpeningEmployee,
    setCashCountOpeningDate,
    setCashCountOpeningComments,
    setCashCountClosingBanknotes,
    setCashCountClosingComments,
    setCashCountSales,
    setCashCount,
    clearCashCount,
    setClosingCashTotalAndDiscrepancy
} = cashCountManagementSlice.actions;

export default cashCountManagementSlice.reducer;

export const selectCashCount = state => state.cashCountManagement;