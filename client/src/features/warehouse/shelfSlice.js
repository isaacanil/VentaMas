import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isOpen: false,    // Controla la visibilidad del modal
    formData: {       // Datos del formulario
        id: "",       // Autogenerado, no necesario en el formulario
        name: "",     // Nombre del estante
        shortName: "", // Nombre corto
        description: "", // Descripción opcional
        rowCapacity: 0,  // Capacidad de fila
    },
    loading: false,    // Estado de carga
    error: null,       // Error en caso de fallo
};

const shelfSlice = createSlice({
    name: 'shelf',
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
            state.formData = initialState.formData; // Restablece el formulario
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
            // Actualiza uno o más campos del formulario
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
} = shelfSlice.actions;

export default shelfSlice.reducer;

// Selector para obtener el estado completo del shelf
export const selectShelfState = (state) => state.shelf;
