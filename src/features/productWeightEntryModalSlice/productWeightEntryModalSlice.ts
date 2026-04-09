// productModalSlice.js
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ProductWeightEntryState {
  isVisible: boolean;
  product: any | null;
  weight: number;
  onAdd: any | null;
  totalPrice: number;
}

interface ProductWeightEntryRootState {
  productWeightEntryModalSlice: ProductWeightEntryState;
}

const initialState: ProductWeightEntryState = {
  isVisible: false,
  product: null,
  weight: 1.0,
  onAdd: null,

  totalPrice: 0,
};

const productWeightEntryModalSlice = createSlice({
  name: 'productWeightEntryModalSlice',
  initialState,
  reducers: {
    openModal: (
      state: ProductWeightEntryState,
      action: PayloadAction<{ product: any }>,
    ) => {
      state.isVisible = true;
      state.product = action.payload.product;
      state.weight = 1.0;
      state.totalPrice = (action.payload.product.pricePerUnit || 0) * 1.0;
    },
    closeModal: (state: ProductWeightEntryState) => {
      state.isVisible = false;
      state.product = null;
      state.weight = 1.0;
      state.totalPrice = 0;
    },
    setWeight: (
      state: ProductWeightEntryState,
      action: PayloadAction<number>,
    ) => {
      state.weight = action.payload;
      if (state.product) {
        state.totalPrice = (state.product.pricePerUnit || 0) * action.payload;
      }
    },
  },
});

export const { openModal, closeModal, setWeight } =
  productWeightEntryModalSlice.actions;

export default productWeightEntryModalSlice.reducer;

export const selectProductWeightEntryModal = (
  state: ProductWeightEntryRootState,
) => state.productWeightEntryModalSlice;
