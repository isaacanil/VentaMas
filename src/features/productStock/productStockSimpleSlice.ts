import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { InventoryStockItem } from '@/utils/inventory/types';
import type { ProductRecord } from '@/types/products';

interface ProductStockSimpleState {
  isOpen: boolean;
  productId: string;
  productStockSelected: string;
  product: ProductRecord | null;
  selectedProductStock: InventoryStockItem | null;
  initialStocks: InventoryStockItem[];
  initialStocksProductId: string;
}

interface ProductStockSimpleRootState {
  productStockSimple: ProductStockSimpleState;
}

type OpenProductStockSimplePayload =
  | ProductRecord
  | {
      product?: ProductRecord | null;
      initialStocks?: InventoryStockItem[] | null;
    }
  | null
  | undefined;

const initialState: ProductStockSimpleState = {
  isOpen: false,
  productId: '',
  productStockSelected: '',
  product: null,
  selectedProductStock: null,
  initialStocks: [],
  initialStocksProductId: '',
};

const isPayloadWithInitialStocks = (
  payload: OpenProductStockSimplePayload,
): payload is {
  product?: ProductRecord | null;
  initialStocks?: InventoryStockItem[] | null;
} => Boolean(payload && typeof payload === 'object' && 'product' in payload);

const productStockSimpleSlice = createSlice({
  name: 'productStockSimple',
  initialState,
  reducers: {
    openProductStockSimple: (
      state: ProductStockSimpleState,
      action: PayloadAction<OpenProductStockSimplePayload>,
    ) => {
      const payload = action.payload;
      const productPayload = isPayloadWithInitialStocks(payload)
        ? payload.product
        : payload;
      const initialStocks = isPayloadWithInitialStocks(payload)
        ? payload.initialStocks
        : null;

      state.isOpen = true;
      if (productPayload) {
        state.productId = productPayload.id ?? '';
        state.product = productPayload;
      } else {
        state.productId = initialState.productId;
        state.product = initialState.product;
      }
      state.initialStocks = Array.isArray(initialStocks) ? initialStocks : [];
      state.initialStocksProductId = state.initialStocks.length
        ? state.productId
        : initialState.initialStocksProductId;
    },
    closeProductStockSimple: (state: ProductStockSimpleState) => {
      state.isOpen = false;
      state.productId = initialState.productId;
      state.product = initialState.product;
      state.initialStocks = initialState.initialStocks;
      state.initialStocksProductId = initialState.initialStocksProductId;
    },
    updateProductId: (
      state: ProductStockSimpleState,
      action: PayloadAction<string>,
    ) => {
      state.productId = action.payload;
      state.initialStocks = initialState.initialStocks;
      state.initialStocksProductId = initialState.initialStocksProductId;
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

export const selectProductStockSimple = (state: ProductStockSimpleRootState) =>
  state.productStockSimple;
