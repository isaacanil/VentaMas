import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isOpen: false,    // Controla la visibilidad del modal
    formData: {       // Datos del formulario
        id: "",       // Autogenerado, no necesario en el formulario
        name: "",     // Nombre de la fila de estante
        shortName: "", // Nombre corto
        description: "", // Descripción opcional
        capacity: 0,  // Capacidad de la fila
    },
    loading: false,    // Estado de carga
    error: null,       // Error en caso de fallo
};

const rowShelfSlice = createSlice({
    name: 'rowShelf',
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
            state.formData = initialState.formData; // Restablece el formulario
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
    openRowShelfForm, 
    closeRowShelfForm, 
    setRowShelfLoading, 
    setRowShelfError,
    clearRowShelfForm,
    updateRowShelfFormData,
} = rowShelfSlice.actions;

export default rowShelfSlice.reducer;

// Selector para obtener el estado completo del rowShelf
export const selectRowShelfState = (state) => state.rowShelf;
