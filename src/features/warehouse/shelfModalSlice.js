import { createSlice } from '@reduxjs/toolkit';

const createInitialShelfFormData = () => ({
    id: "",
    name: "",
    shortName: "",
    description: "",
    rowCapacity: 0,
});

const initialState = {
    isOpen: false,
    formData: createInitialShelfFormData(),
    path: [],
    loading: false,
    error: null,
};

const shelfModalSlice = createSlice({
    name: 'shelfModal', // Updated slice name
    initialState,
    reducers: {
        openShelfForm: (state, action) => {
            state.isOpen = true;
            const data = action.payload.data;
            state.path = (action.payload.path || []).map((node) => ({ ...node }));
            if (data) {
                state.formData = { ...createInitialShelfFormData(), ...data };
            } else {
                state.formData = createInitialShelfFormData();
            }
            state.loading = false;
            state.error = null;
        },
        closeShelfForm: (state) => {
            state.isOpen = false;
            state.formData = createInitialShelfFormData();
            state.path = [];
            state.loading = false;
            state.error = null;
        },
        setShelfLoading: (state, action) => {
            state.loading = action.payload;
        },
        setShelfError: (state, action) => {
            state.error = action.payload;
        },
        clearShelfForm: (state) => {
            state.formData = createInitialShelfFormData();
            state.error = null;
            state.loading = false;
            state.path = [];
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
