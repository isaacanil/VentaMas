import { createSlice } from '@reduxjs/toolkit';

const createInitialWarehouseFormData = () => ({
  id: '',
  name: '',
  shortName: '',
  description: '',
  owner: '',
  location: '',
  address: '',
  dimension: { length: 0, width: 0, height: 0 },
  capacity: 0,
});

const normalizeWarehouseFormData = (data = {}) => {
  const base = createInitialWarehouseFormData();
  return {
    ...base,
    ...data,
    dimension: {
      ...base.dimension,
      ...(data.dimension || {}),
    },
  };
};

const initialState = {
  isOpen: false,
  formData: createInitialWarehouseFormData(),
  loading: false,
  error: null,
};

const warehouseModalSlice = createSlice({
  name: 'warehouseModal', // Slice name
  initialState,
  reducers: {
    openWarehouseForm: (state, action) => {
      state.isOpen = true;
      const data = action.payload;
      if (data) {
        state.formData = normalizeWarehouseFormData(action.payload);
      } else {
        state.formData = createInitialWarehouseFormData();
      }
      state.loading = false;
      state.error = null;
    },
    closeWarehouseForm: (state) => {
      state.isOpen = false;
      state.formData = createInitialWarehouseFormData();
      state.loading = false;
      state.error = null;
    },
    setWarehouseLoading: (state, action) => {
      state.loading = action.payload;
    },
    setWarehouseError: (state, action) => {
      state.error = action.payload;
    },
    clearWarehouseForm: (state) => {
      state.formData = createInitialWarehouseFormData();
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
