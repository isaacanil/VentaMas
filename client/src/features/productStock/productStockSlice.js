import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isOpen: false,
    formData: {
        id: "", // Autogenerado, no necesario en el formulario
        batchId: "",
        location: {},
        productId: "",
        productName: "",
        stock: 0, // Cantidad de stock
    },
    loading: false,
    error: null,
};

const productStockSlice = createSlice({
    name: 'productStock',
    initialState,
    reducers: {
        openProductStock: (state, action) => {
            state.isOpen = true;
            if (action.payload) {
                state.formData = {
                    ...initialState.formData,
                    ...action.payload,
                }
            } else {
                state.formData = initialState.formData;
            }
        },
        closeProductStock: (state) => {
            state.isOpen = false;
            state.formData = initialState.formData;
        },
        setProductStockLoading: (state, action) => {
            state.loading = action.payload;
        },
        setProductStockError: (state, action) => {
            state.error = action.payload;
        },
        setProductStockClear: (state) => {
            state.formData = initialState.formData;
            state.error = null;
            state.loading = false;
        },
        updateProductStockFormData: (state, action) => {
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

export const selectProductStock = (state) => state.productStock;
