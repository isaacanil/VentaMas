import { createSlice, type type PayloadAction } from '@reduxjs/toolkit';

import type { LocationRefLike } from '@/utils/inventory/types';

type ProductStockFormData = {
  id: string;
  batchId: string;
  location: LocationRefLike | Record<string, unknown>;
  locationId?: string | null;
  path?: string;
  productId: string;
  productName: string;
  stock: number;
};

type ProductStockState = {
  isOpen: boolean;
  formData: ProductStockFormData;
  loading: boolean;
  error: unknown | null;
};

const initialState: ProductStockState = {
  isOpen: false,
  formData: {
    id: '', // Autogenerado, no necesario en el formulario
    batchId: '',
    location: {},
    locationId: '',
    path: '',
    productId: '',
    productName: '',
    stock: 0, // Cantidad de stock
  },
  loading: false,
  error: null,
};

const productStockSlice = createSlice({
  name: 'productStock',
  initialState,
  reducers: {
    openProductStock: (
      state,
      action: PayloadAction<Partial<ProductStockFormData> | undefined>,
    ) => {
      state.isOpen = true;
      if (action.payload) {
        state.formData = {
          ...initialState.formData,
          ...action.payload,
        };
      } else {
        state.formData = initialState.formData;
      }
    },
    closeProductStock: (state: any) => {
      state.isOpen = false;
      state.formData = initialState.formData;
    },
    setProductStockLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProductStockError: (state, action: PayloadAction<unknown | null>) => {
      state.error = action.payload;
    },
    setProductStockClear: (state: any) => {
      state.formData = initialState.formData;
      state.error = null;
      state.loading = false;
    },
    updateProductStockFormData: (
      state,
      action: PayloadAction<Partial<ProductStockFormData>>,
    ) => {
      state.formData = {
        ...state.formData,
        ...action.payload,
      };
    },
  },
});

export const {
  openProductStock,
  closeProductStock,
  setProductStockLoading,
  setProductStockError,
  setProductStockClear,
  updateProductStockFormData,
} = productStockSlice.actions;

export default productStockSlice.reducer;

export const selectProductStock = (state: { productStock: ProductStockState }) =>
  state.productStock;


