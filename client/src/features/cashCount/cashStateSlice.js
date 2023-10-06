import { createSlice } from '@reduxjs/toolkit';

let initialState = {
  cashReconciliation: {
    state: "closed",
    cashCount:{}
  },
}

const cashCountStateSlice = createSlice({
  name: 'cashCountState',
  initialState,
  reducers: {
    setCashReconciliation: (state, action) => {
      if (action.payload && typeof action.payload === 'object') { // Validación básica, mejora según tus necesidades
        state.cashReconciliation = action.payload;
      } else {
        state.cashReconciliation = null;
      }
    },
    clearCashReconciliation: (state) => {
      state.cashReconciliation = {
        state: "closed",
        cashCount:{}
      };
    },
  },
});

export const { setCashReconciliation, clearCashReconciliation } = cashCountStateSlice.actions;

export default cashCountStateSlice.reducer;

export const selectCashReconciliation = (state) => state.cashCountState.cashReconciliation;
