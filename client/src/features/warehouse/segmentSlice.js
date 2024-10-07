// Redux Slice for Segment
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isOpen: false,    // Controla la visibilidad del modal
    formData: {       // Datos del formulario del segmento
        id: "",       // Autogenerado, no necesario en el formulario
        name: "",     // Nombre del segmento
        shortName: "", // Nombre corto del segmento
        description: "", // Descripción opcional del segmento
        rowShelfId: "", // ID de la fila del estante asociado
        capacity: 0,  // Capacidad del segmento
        createdAt: null,
        createdBy: "",
        updatedAt: null,
        updatedBy: "",
        deletedAt: null,
        deletedBy: "",
    },
    loading: false,    // Estado de carga
    error: null,       // Error en caso de fallo
};

const segmentSlice = createSlice({
    name: 'segment',
    initialState,
    reducers: {
        openSegmentForm: (state, action) => {
            state.isOpen = true;
            const data = action.payload;
            if (data) {
                state.formData = action.payload;
            } else {
                state.formData = initialState.formData;
            }
        },
        closeSegmentForm: (state) => {
            state.isOpen = false;
            state.formData = initialState.formData; // Restablece el formulario
        },
        setSegmentLoading: (state, action) => {
            state.loading = action.payload;
        },
        setSegmentError: (state, action) => {
            state.error = action.payload;
        },
        clearSegmentForm: (state) => {
            state.formData = initialState.formData;
            state.error = null;
            state.loading = false;
        },
        updateSegmentFormData: (state, action) => {
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
    openSegmentForm, 
    closeSegmentForm, 
    setSegmentLoading, 
    setSegmentError,
    clearSegmentForm,
    updateSegmentFormData,
} = segmentSlice.actions;

export default segmentSlice.reducer;

// Selector para obtener el estado completo del segmento
export const selectSegmentState = (state) => state.segment;