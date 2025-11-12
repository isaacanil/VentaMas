import { createSlice } from '@reduxjs/toolkit';

const createInitialSegmentFormData = () => ({
    id: "",
    name: "",
    shortName: "",
    description: "",
    rowShelfId: "",
    capacity: 0,
    createdAt: null,
    createdBy: "",
    updatedAt: null,
    updatedBy: "",
    deletedAt: null,
    deletedBy: "",
});

const initialState = {
    isOpen: false,
    formData: createInitialSegmentFormData(),
    path: [],
    loading: false,
    error: null,
};

const segmentModalSlice = createSlice({
    name: 'segmentModal', // Updated slice name
    initialState,
    reducers: {
        openSegmentForm: (state, action) => {
            state.isOpen = true;
            const data = action.payload.data;
            state.path = (action.payload.path || []).map((node) => ({ ...node }));
            if (data) {
                state.formData = { ...createInitialSegmentFormData(), ...data };
            } else {
                state.formData = createInitialSegmentFormData();
            }
            state.loading = false;
            state.error = null;
        },
        closeSegmentForm: (state) => {
            state.isOpen = false;
            state.formData = createInitialSegmentFormData();
            state.path = [];
            state.loading = false;
            state.error = null;
        },
        setSegmentLoading: (state, action) => {
            state.loading = action.payload;
        },
        setSegmentError: (state, action) => {
            state.error = action.payload;
        },
        clearSegmentForm: (state) => {
            state.formData = createInitialSegmentFormData();
            state.error = null;
            state.loading = false;
            state.path = [];
        },
        updateSegmentFormData: (state, action) => {
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
} = segmentModalSlice.actions;

export default segmentModalSlice.reducer;

// Selector para obtener el estado completo del segmento
export const selectSegmentState = (state) => state.segmentModal;
