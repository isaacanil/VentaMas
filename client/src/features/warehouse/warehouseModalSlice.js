
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isOpen: false,    // Controls the visibility of the modal
    formData: {       // Data for the form
        id: "",        // Auto-generated, not needed in the form
        name: "",      // Name of the warehouse
        shortName: "", // Short name
        description: "", // Optional description
        owner: "",     // Owner of the warehouse
        location: "",  // Location
        address: "",   // Address
        dimension: { length: 0, width: 0, height: 0 }, // Dimensions
        capacity: 0,    // Capacity in cubic meters
    },
    loading: false,    // Loading state
    error: null,       // Error state
};

const warehouseModalSlice = createSlice({
    name: 'warehouseModal', // Slice name
    initialState,
    reducers: {
        openWarehouseForm: (state, action) => {
            state.isOpen = true;
            const data = action.payload;
            if (data) {
                state.formData = action.payload;
            } else {
                state.formData = initialState.formData;
            }
        },
        closeWarehouseForm: (state) => {
            state.isOpen = false;
            state.formData = initialState.formData;
        },
        setWarehouseLoading: (state, action) => {
            state.loading = action.payload;
        },
        setWarehouseError: (state, action) => {
            state.error = action.payload;
        },
        clearWarehouseForm: (state) => {
            state.formData = initialState.formData;
            state.error = null;
            state.loading = false;
        },
        updateWarehouseFormData: (state, action) => {
            state.formData = {
                ...state.formData,
                ...action.payload,
            };
        },
    },
});

// Export actions and reducer
export const { 
    openWarehouseForm, 
    closeWarehouseForm, 
    setWarehouseLoading, 
    setWarehouseError,
    clearWarehouseForm,
    updateWarehouseFormData,
} = warehouseModalSlice.actions;

export default warehouseModalSlice.reducer;

// Selector to get the complete state of the warehouse form
export const selectWarehouseModalState = (state) => state.warehouseModal;