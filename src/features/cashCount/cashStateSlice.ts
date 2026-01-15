import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CashReconciliation {
  state: 'open' | 'closed' | string;
  cashCount: any;
}

interface CashCountState {
  cashReconciliation: CashReconciliation | null;
}

interface CashCountStateRoot {
  cashCountState: CashCountState;
}

let initialState: CashCountState = {
  cashReconciliation: {
    state: 'closed',
    cashCount: {},
  },
};

const cashCountStateSlice = createSlice({
  name: 'cashCountState',
  initialState,
  reducers: {
    setCashReconciliation: (state: CashCountState, action: PayloadAction<any>) => {
      if (action.payload && typeof action.payload === 'object') {
        // Validación básica, mejora según tus necesidades
        state.cashReconciliation = action.payload;
      } else {
        state.cashReconciliation = null;
      }
    },
    clearCashReconciliation: (state: CashCountState) => {
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

export const selectCashReconciliation = (state: CashCountStateRoot) =>
  state.cashCountState.cashReconciliation;
