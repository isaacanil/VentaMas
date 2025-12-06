import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  productId: '',
  productStockSelected: '',
  product: {},
  selectedProductStock: null,
};

const productStockSimpleSlice = createSlice({
  name: 'productStockSimple',
  initialState,
  reducers: {
    openProductStockSimple: (state, action) => {
      state.isOpen = true;
      if (action.payload) {
        state.productId = action.payload.id;
        state.product = action.payload;
      } else {
        state.productId = initialState.productId;
      }
    },
    closeProductStockSimple: (state) => {
      state.isOpen = false;
      state.productId = initialState.productId;
    },
    updateProductId: (state, action) => {
      state.productId = action.payload;
    },
    setSelectedProductStock: (state, action) => {
      state.selectedProductStock = action.payload;
    },
  },
});

export const {
  openProductStockSimple,
  closeProductStockSimple,
  updateProductId,
  setSelectedProductStock,
} = productStockSimpleSlice.actions;

export default productStockSimpleSlice.reducer;

export const selectProductStockSimple = (state) => state.productStockSimple;
