import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  productStockId: null,
  batchId: null,
  actionType: 'productStock',
};

const deleteProductStockSlice = createSlice({
  name: 'deleteProductStock',
  initialState,
  reducers: {
    openDeleteModal: (state, action) => {
      state.isOpen = true;
      state.productStockId = action.payload.productStockId;
      state.batchId = action.payload.batchId;
      state.actionType = action.payload.actionType;
    },
    closeDeleteModal: (state) => {
      state.isOpen = false;
      state.productStockId = null;
      state.batchId = null;
    },
    changeActionType: (state, action) => {
      state.actionType = action.payload;
    },
  },
});

export const { openDeleteModal, closeDeleteModal, changeActionType } =
  deleteProductStockSlice.actions;
export const selectDeleteModalState = (state) => state.deleteProductStock;
export default deleteProductStockSlice.reducer;
