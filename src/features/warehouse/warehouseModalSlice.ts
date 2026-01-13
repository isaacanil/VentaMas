import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Warehouse } from '@/models/Warehouse/Warehouse';

type WarehouseFormData = Omit<Warehouse, 'number'> & { number?: number };

type WarehouseModalState = {
  isOpen: boolean;
  formData: WarehouseFormData;
  loading: boolean;
  error: unknown | null;
};

const createInitialWarehouseFormData = (): WarehouseFormData => ({
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

const normalizeWarehouseFormData = (data: Partial<WarehouseFormData> = {}) => {
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

const initialState: WarehouseModalState = {
  isOpen: false,
  formData: createInitialWarehouseFormData(),
  loading: false,
  error: null,
};

const warehouseModalSlice = createSlice({
  name: 'warehouseModal', // Slice name
  initialState,
  reducers: {
    openWarehouseForm: (
      state,
      action: PayloadAction<Partial<WarehouseFormData> | void | undefined>,
    ) => {
      state.isOpen = true;
      const data = action.payload;
      if (data && typeof data === 'object') {
        state.formData = normalizeWarehouseFormData(data as Partial<WarehouseFormData>);
      } else {
        state.formData = createInitialWarehouseFormData();
      }
      state.loading = false;
      state.error = null;
    },
    closeWarehouseForm: (state: any) => {
      state.isOpen = false;
      state.formData = createInitialWarehouseFormData();
      state.loading = false;
      state.error = null;
    },
    setWarehouseLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setWarehouseError: (state, action: PayloadAction<unknown | null>) => {
      state.error = action.payload;
    },
    clearWarehouseForm: (state: any) => {
      state.formData = createInitialWarehouseFormData();
      state.error = null;
      state.loading = false;
    },
    updateWarehouseFormData: (
      state,
      action: PayloadAction<Partial<WarehouseFormData>>,
    ) => {
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
export const selectWarehouseModalState = (state: {
  warehouseModal: WarehouseModalState;
}) => state.warehouseModal;


