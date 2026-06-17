import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface BarcodePrintModalState {
  isOpen: boolean;
  product: any | null;
}

interface BarcodePrintModalRootState {
  barcodePrintModal: BarcodePrintModalState;
}

const initialState: BarcodePrintModalState = {
  isOpen: false,
  product: null,
};

export const barcodePrintModalSlice = createSlice({
  name: 'barcodePrintModal',
  initialState,
  reducers: {
    toggleBarcodeModal: (
      state: BarcodePrintModalState,
      action: PayloadAction<any>,
    ) => {
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

export const SelectBarcodePrintModal = (state: BarcodePrintModalRootState) =>
  state.barcodePrintModal;
