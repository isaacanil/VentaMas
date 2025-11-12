import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    brandModal: {
        isOpen: false,
        initialValues: null,
    },
};

const productBrandSlice = createSlice({
    name: 'productBrand',
    initialState,
    reducers: {
        openBrandModal: (state, action) => {
            state.brandModal.isOpen = true;
            state.brandModal.initialValues = action?.payload?.initialValues || null;
        },
        closeBrandModal: (state) => {
            state.brandModal.isOpen = false;
            state.brandModal.initialValues = null;
        },
    },
});

export const { openBrandModal, closeBrandModal } = productBrandSlice.actions;

export const selectProductBrandModal = (state) => state.productBrand.brandModal;

export default productBrandSlice.reducer;
