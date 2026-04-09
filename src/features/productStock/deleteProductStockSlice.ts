import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type DeleteActionType = 'productStock' | 'batch';

interface DeleteProductStockState {
  isOpen: boolean;
  productStockId: string | null;
  batchId: string | null;
  actionType: DeleteActionType;
}

interface OpenDeletePayload {
  productStockId: string | null;
  batchId: string | null;
  actionType: DeleteActionType;
}

interface DeleteProductStockRootState {
  deleteProductStock: DeleteProductStockState;
}

const initialState: DeleteProductStockState = {
  isOpen: false,
  productStockId: null,
  batchId: null,
  actionType: 'productStock',
};

const deleteProductStockSlice = createSlice({
  name: 'deleteProductStock',
  initialState,
  reducers: {
    openDeleteModal: (
      state: DeleteProductStockState,
      action: PayloadAction<OpenDeletePayload>,
    ) => {
      state.isOpen = true;
      state.productStockId = action.payload.productStockId;
      state.batchId = action.payload.batchId;
      state.actionType = action.payload.actionType;
    },
    closeDeleteModal: (state: DeleteProductStockState) => {
      state.isOpen = false;
      state.productStockId = null;
      state.batchId = null;
    },
    changeActionType: (
      state: DeleteProductStockState,
      action: PayloadAction<DeleteActionType>,
    ) => {
      state.actionType = action.payload;
    },
  },
});

export const { openDeleteModal, closeDeleteModal, changeActionType } =
  deleteProductStockSlice.actions;
export const selectDeleteModalState = (state: DeleteProductStockRootState) =>
  state.deleteProductStock;
export default deleteProductStockSlice.reducer;
