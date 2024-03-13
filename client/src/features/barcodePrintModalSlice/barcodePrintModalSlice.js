import { createSlice } from '@reduxjs/toolkit';

export const barcodePrintModalSlice = createSlice({
  name: 'barcodePrintModal',
  initialState: {
    isOpen: false,
    product: null,
  },
  reducers: {
    toggleBarcodeModal: (state, action) => {
      const product = action.payload;
      if (product) {
        state.isOpen = true;
        state.product = product;
      } else {
        state.isOpen = false;
        state.product = null;
      }
    },



  },
});

// Action creators are generated for each case reducer function
export const { toggleBarcodeModal } = barcodePrintModalSlice.actions;

export default barcodePrintModalSlice.reducer;

export const SelectBarcodePrintModal = (state) => state.barcodePrintModal
