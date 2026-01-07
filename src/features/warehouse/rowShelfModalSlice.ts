import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RowShelf } from '@/models/Warehouse/RowShelf';

type RowShelfFormData = Pick<
  RowShelf,
  'id' | 'name' | 'shortName' | 'description' | 'capacity'
>;

type PathNode = Record<string, unknown>;

type RowShelfModalState = {
  isOpen: boolean;
  formData: RowShelfFormData;
  path: PathNode[];
  loading: boolean;
  error: unknown | null;
};

type OpenRowShelfPayload = {
  data?: Partial<RowShelfFormData> | null;
  path?: PathNode[];
};

const createInitialRowShelfFormData = (): RowShelfFormData => ({
  id: '',
  name: '',
  shortName: '',
  description: '',
  capacity: 0,
});

const initialState: RowShelfModalState = {
  isOpen: false,
  formData: createInitialRowShelfFormData(),
  path: [],
  loading: false,
  error: null,
};

const rowShelfModalSlice = (createSlice as any)({
  name: 'rowShelfModal',
  initialState,
  reducers: {
    openRowShelfForm: (state, action: PayloadAction<OpenRowShelfPayload>) => {
      state.isOpen = true;
      const data = action.payload.data;
      state.path = (action.payload.path || []).map((node) => ({ ...node }));
      if (data) {
        state.formData = { ...createInitialRowShelfFormData(), ...data };
      } else {
        state.formData = createInitialRowShelfFormData();
      }
      state.loading = false;
      state.error = null;
    },
    closeRowShelfForm: (state) => {
      state.isOpen = false;
      state.formData = createInitialRowShelfFormData();
      state.path = [];
      state.loading = false;
      state.error = null;
    },
    setRowShelfLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setRowShelfError: (state, action: PayloadAction<unknown | null>) => {
      state.error = action.payload;
    },
    clearRowShelfForm: (state) => {
      state.formData = createInitialRowShelfFormData();
      state.error = null;
      state.loading = false;
      state.path = [];
    },
    updateRowShelfFormData: (
      state,
      action: PayloadAction<Partial<RowShelfFormData>>,
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
  openRowShelfForm,
  closeRowShelfForm,
  setRowShelfLoading,
  setRowShelfError,
  clearRowShelfForm,
  updateRowShelfFormData,
} = rowShelfModalSlice.actions;

export default rowShelfModalSlice.reducer;

// Selector para obtener el estado completo del rowShelf
export const selectRowShelfState = (state: {
  rowShelfModal: RowShelfModalState;
}) => state.rowShelfModal;
