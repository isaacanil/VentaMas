// productModalSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isVisible: false,
  product: null,
  weight: 1.000,
  product: null,
  onAdd: null,
  
  totalPrice: 0,
};

const productWeightEntryModalSlice = createSlice({
  name: 'productWeightEntryModalSlice',
  initialState,
  reducers: {
    openModal: (state, action) => {
      state.isVisible = true;
      state.product = action.payload.product;
      state.weight = 1.000;
      state.totalPrice = action.payload.product.pricePerUnit * 1.000;
    },
    closeModal: (state) => {
      state.isVisible = false;
      state.product = null;
      state.weight = 1.000;
      state.totalPrice = 0;
    },
    setWeight: (state, action) => {
      state.weight = action.payload;
      state.totalPrice = state.product.pricePerUnit * action.payload;
    },
  },
});

export const { openModal, closeModal, setWeight } = productWeightEntryModalSlice.actions;

export default productWeightEntryModalSlice.reducer;
