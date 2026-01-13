import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

let initialState = {
  cashReconciliation: {
    state: 'closed',
    cashCount: {},
  },
};

const cashCountStateSlice = createSlice({
  name: 'cashCountState',
  initialState,
  reducers: {
    setCashReconciliation: (state: any, action: PayloadAction<any>) => {
      if (action.payload && typeof action.payload === 'object') {
        // ValidaciÃ³n bÃ¡sica, mejora segÃºn tus necesidades
        state.cashReconciliation = action.payload;
      } else {
        state.cashReconciliation = null;
      }
    },
    clearCashReconciliation: (state: any) => {
      state.cashReconciliation = {
        state: 'closed',
        cashCount: {},
      };
    },
  },
});

export const { setCashReconciliation, clearCashReconciliation } =
  cashCountStateSlice.actions;

export default cashCountStateSlice.reducer;

export const selectCashReconciliation = (state) =>
  state.cashCountState.cashReconciliation;


