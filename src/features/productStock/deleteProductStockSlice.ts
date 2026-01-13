import { createSlice, type type PayloadAction } from '@reduxjs/toolkit';

type DeleteActionType = 'productStock' | 'batch';

type DeleteProductStockState = {
  isOpen: boolean;
  productStockId: string | null;
  batchId: string | null;
  actionType: DeleteActionType;
};

type OpenDeletePayload = {
  productStockId: string | null;
  batchId: string | null;
  actionType: DeleteActionType;
};

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
    openDeleteModal: (state, action: PayloadAction<OpenDeletePayload>) => {
      state.isOpen = true;
      state.productStockId = action.payload.productStockId;
      state.batchId = action.payload.batchId;
      state.actionType = action.payload.actionType;
    },
    closeDeleteModal: (state: any) => {
      state.isOpen = false;
      state.productStockId = null;
      state.batchId = null;
    },
    changeActionType: (state, action: PayloadAction<DeleteActionType>) => {
      state.actionType = action.payload;
    },
  },
});

export const { openDeleteModal, closeDeleteModal, changeActionType } =
  deleteProductStockSlice.actions;
export const selectDeleteModalState = (state: {
  deleteProductStock: DeleteProductStockState;
}) => state.deleteProductStock;
export default deleteProductStockSlice.reducer;

