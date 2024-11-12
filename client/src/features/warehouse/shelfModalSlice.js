
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isOpen: false,
    formData: {
        id: "",
        name: "",
        shortName: "",
        description: "",
        rowCapacity: 0,
    },
    loading: false,
    error: null,
};

const shelfModalSlice = createSlice({
    name: 'shelfModal', // Updated slice name
    initialState,
    reducers: {
        openShelfForm: (state, action) => {
            state.isOpen = true;
            const data = action.payload;
            if (data) {
                state.formData = action.payload;
            } else {
                state.formData = initialState.formData;
            }
        },
        closeShelfForm: (state) => {
            state.isOpen = false;
            state.formData = initialState.formData;
        },
        setShelfLoading: (state, action) => {
            state.loading = action.payload;
        },
        setShelfError: (state, action) => {
            state.error = action.payload;
        },
        clearShelfForm: (state) => {
            state.formData = initialState.formData;
            state.error = null;
            state.loading = false;
        },
        updateShelfFormData: (state, action) => {
            state.formData = {
                ...state.formData,
                ...action.payload,
            };
        },
    },
});

// Exportar acciones y reducer
export const { 
    openShelfForm, 
    closeShelfForm, 
    setShelfLoading, 
    setShelfError,
    clearShelfForm,
    updateShelfFormData,
} = shelfModalSlice.actions;

export default shelfModalSlice.reducer;

// Selector para obtener el estado completo del shelf
export const selectShelfState = (state) => state.shelfModal;