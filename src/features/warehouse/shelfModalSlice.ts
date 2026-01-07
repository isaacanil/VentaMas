import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Shelf } from '@/models/Warehouse/Shelf';

type ShelfFormData = Pick<
  Shelf,
  'id' | 'name' | 'shortName' | 'description' | 'rowCapacity'
>;

type PathNode = Record<string, unknown>;

type ShelfModalState = {
  isOpen: boolean;
  formData: ShelfFormData;
  path: PathNode[];
  loading: boolean;
  error: unknown | null;
};

type OpenShelfPayload = {
  data?: Partial<ShelfFormData> | null;
  path?: PathNode[];
};

const createInitialShelfFormData = (): ShelfFormData => ({
  id: '',
  name: '',
  shortName: '',
  description: '',
  rowCapacity: 0,
});

const initialState: ShelfModalState = {
  isOpen: false,
  formData: createInitialShelfFormData(),
  path: [],
  loading: false,
  error: null,
};

const shelfModalSlice = (createSlice as any)({
  name: 'shelfModal', // Updated slice name
  initialState,
  reducers: {
    openShelfForm: (state, action: PayloadAction<OpenShelfPayload>) => {
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
    setShelfLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setShelfError: (state, action: PayloadAction<unknown | null>) => {
      state.error = action.payload;
    },
    clearShelfForm: (state) => {
      state.formData = createInitialShelfFormData();
      state.error = null;
      state.loading = false;
      state.path = [];
    },
    updateShelfFormData: (
      state,
      action: PayloadAction<Partial<ShelfFormData>>,
    ) => {
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
export const selectShelfState = (state: { shelfModal: ShelfModalState }) =>
  state.shelfModal;
