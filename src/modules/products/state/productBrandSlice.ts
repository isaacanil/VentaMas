import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ProductBrandState {
  brandModal: {
    isOpen: boolean;
    initialValues: any | null;
  };
}

interface ProductBrandRootState {
  productBrand: ProductBrandState;
}

const initialState: ProductBrandState = {
  brandModal: {
    isOpen: false,
    initialValues: null,
  },
};

const productBrandSlice = createSlice({
  name: 'productBrand',
  initialState,
  reducers: {
    openBrandModal: (
      state: ProductBrandState,
      action: PayloadAction<{ initialValues?: any } | undefined>,
    ) => {
      state.brandModal.isOpen = true;
      state.brandModal.initialValues = action?.payload?.initialValues || null;
    },
    closeBrandModal: (state: ProductBrandState) => {
      state.brandModal.isOpen = false;
      state.brandModal.initialValues = null;
    },
  },
});

export const { openBrandModal, closeBrandModal } = productBrandSlice.actions;

export const selectProductBrandModal = (state: ProductBrandRootState) =>
  state.productBrand.brandModal;

export default productBrandSlice.reducer;
