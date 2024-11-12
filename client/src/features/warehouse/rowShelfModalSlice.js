
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isOpen: false,
    formData: {
        id: "",
        name: "",
        shortName: "",
        description: "",
        capacity: 0,
    },
    loading: false,
    error: null,
};

const rowShelfModalSlice = createSlice({
    name: 'rowShelfModal', // Updated slice name
    initialState,
    reducers: {
        openRowShelfForm: (state, action) => {
            state.isOpen = true;
            const data = action.payload;
            if (data) {
                state.formData = action.payload;
            } else {
                state.formData = initialState.formData;
            }
        },
        closeRowShelfForm: (state) => {
            state.isOpen = false;
            state.formData = initialState.formData;
        },
        setRowShelfLoading: (state, action) => {
            state.loading = action.payload;
        },
        setRowShelfError: (state, action) => {
            state.error = action.payload;
        },
        clearRowShelfForm: (state) => {
            state.formData = initialState.formData;
            state.error = null;
            state.loading = false;
        },
        updateRowShelfFormData: (state, action) => {
            state.formData = {
                ...state.formData,
                ...action.payload,
            };
        },
    },
});

// Exportar acciones y reducer
export const { 
    openRowShelfForm, 
    closeRowShelfForm, 
    setRowShelfLoading, 
    setRowShelfError,
    clearRowShelfForm,
    updateRowShelfFormData,
} = rowShelfModalSlice.actions;

export default rowShelfModalSlice.reducer;

// Selector para obtener el estado completo del rowShelf
export const selectRowShelfState = (state) => state.rowShelfModal;