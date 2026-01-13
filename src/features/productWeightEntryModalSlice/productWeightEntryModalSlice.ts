// productModalSlice.js
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {
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
    openModal: (state: any, action: PayloadAction<any>) => {
      state.isVisible = true;
      state.product = action.payload.product;
      state.weight = 1.0;
      state.totalPrice = action.payload.product.pricePerUnit * 1.0;
    },
    closeModal: (state: any) => {
      state.isVisible = false;
      state.product = null;
      state.weight = 1.0;
      state.totalPrice = 0;
    },
    setWeight: (state: any, action: PayloadAction<any>) => {
      state.weight = action.payload;
      state.totalPrice = state.product.pricePerUnit * action.payload;
    },
  },
});

export const { openModal, closeModal, setWeight } =
  productWeightEntryModalSlice.actions;

export default productWeightEntryModalSlice.reducer;


