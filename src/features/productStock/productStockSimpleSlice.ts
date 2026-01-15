import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { InventoryStockItem } from '@/utils/inventory/types';
import type { ProductRecord } from '@/types/products';

interface ProductStockSimpleState {
  isOpen: boolean;
  productId: string;
  productStockSelected: string;
  product: ProductRecord | null;
  selectedProductStock: InventoryStockItem | null;
}

interface ProductStockSimpleRootState {
  productStockSimple: ProductStockSimpleState;
}

const initialState: ProductStockSimpleState = {
  isOpen: false,
  productId: '',
  productStockSelected: '',
  product: null,
  selectedProductStock: null,
};

const productStockSimpleSlice = createSlice({
  name: 'productStockSimple',
  initialState,
  reducers: {
    openProductStockSimple: (
      state: ProductStockSimpleState,
      action: PayloadAction<ProductRecord | null | undefined>,
    ) => {
      state.isOpen = true;
      if (action.payload) {
        state.productId = action.payload.id ?? '';
        state.product = action.payload;
      } else {
        state.productId = initialState.productId;
        state.product = initialState.product;
      }
    },
    closeProductStockSimple: (state: ProductStockSimpleState) => {
      state.isOpen = false;
      state.productId = initialState.productId;
      state.product = initialState.product;
    },
    updateProductId: (state: ProductStockSimpleState, action: PayloadAction<string>) => {
      state.productId = action.payload;
    },
    setSelectedProductStock: (
      state: ProductStockSimpleState,
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

export const selectProductStockSimple = (state: ProductStockSimpleRootState) => state.productStockSimple;
