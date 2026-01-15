import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PurchasesState {
  purchases: any[];
}

interface PurchasesRootState {
  purchases: PurchasesState;
}

const initialState: PurchasesState = {
  purchases: [],
};

export const purchasesSlice = createSlice({
  name: 'purchases',
  initialState,
  reducers: {
    updatePurchases: (state: PurchasesState, actions: PayloadAction<any[]>) => {
      const data = actions.payload;
      state.purchases = data;
    },
  },
});

export const { updatePurchases } = purchasesSlice.actions;

export const selectPurchaseList = (state: PurchasesRootState) => state.purchases.purchases;

export default purchasesSlice.reducer;
