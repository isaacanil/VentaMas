import { createSlice } from '@reduxjs/toolkit';

const createInitialRowShelfFormData = () => ({
  id: '',
  name: '',
  shortName: '',
  description: '',
  capacity: 0,
});

const initialState = {
  isOpen: false,
  formData: createInitialRowShelfFormData(),
  path: [],
  loading: false,
  error: null,
};

const rowShelfModalSlice = createSlice({
  name: 'rowShelfModal',
  initialState,
  reducers: {
    openRowShelfForm: (state, action) => {
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
    setRowShelfLoading: (state, action) => {
      state.loading = action.payload;
    },
    setRowShelfError: (state, action) => {
      state.error = action.payload;
    },
    clearRowShelfForm: (state) => {
      state.formData = createInitialRowShelfFormData();
      state.error = null;
      state.loading = false;
      state.path = [];
    },
    updateRowShelfFormData: (state, action) => {
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
export const selectRowShelfState = (state) => state.rowShelfModal;
