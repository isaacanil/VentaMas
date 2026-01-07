import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { InventoryStockItem } from '@/utils/inventory/types';

type ProductRecord = { id: string } & Record<string, unknown>;

type ProductStockSimpleState = {
  isOpen: boolean;
  productId: string;
  productStockSelected: string;
  product: ProductRecord | null;
  selectedProductStock: InventoryStockItem | null;
};

const initialState: ProductStockSimpleState = {
  isOpen: false,
  productId: '',
  productStockSelected: '',
  product: null,
  selectedProductStock: null,
};

const productStockSimpleSlice = (createSlice as any)({
  name: 'productStockSimple',
  initialState,
  reducers: {
    openProductStockSimple: (
      state,
      action: PayloadAction<ProductRecord | null | undefined>,
    ) => {
      state.isOpen = true;
      if (action.payload) {
        state.productId = action.payload.id;
        state.product = action.payload;
      } else {
        state.productId = initialState.productId;
        state.product = initialState.product;
      }
    },
    closeProductStockSimple: (state) => {
      state.isOpen = false;
      state.productId = initialState.productId;
      state.product = initialState.product;
    },
    updateProductId: (state, action: PayloadAction<string>) => {
      state.productId = action.payload;
    },
    setSelectedProductStock: (
      state,
      action: PayloadAction<InventoryStockItem | null>,
    ) => {
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

export const selectProductStockSimple = (state: {
  productStockSimple: ProductStockSimpleState;
}) => state.productStockSimple;
