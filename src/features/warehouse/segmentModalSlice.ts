import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type SegmentFormData = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  rowShelfId: string;
  capacity: number;
  createdAt: unknown | null;
  createdBy: string;
  updatedAt: unknown | null;
  updatedBy: string;
  deletedAt: unknown | null;
  deletedBy: string;
};

type PathNode = Record<string, unknown>;

type SegmentModalState = {
  isOpen: boolean;
  formData: SegmentFormData;
  path: PathNode[];
  loading: boolean;
  error: unknown | null;
};

type OpenSegmentPayload = {
  data?: Partial<SegmentFormData> | null;
  path?: PathNode[];
};

const createInitialSegmentFormData = (): SegmentFormData => ({
  id: '',
  name: '',
  shortName: '',
  description: '',
  rowShelfId: '',
  capacity: 0,
  createdAt: null,
  createdBy: '',
  updatedAt: null,
  updatedBy: '',
  deletedAt: null,
  deletedBy: '',
});

const initialState: SegmentModalState = {
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
    openSegmentForm: (state, action: PayloadAction<OpenSegmentPayload>) => {
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
    closeSegmentForm: (state: any) => {
      state.isOpen = false;
      state.formData = createInitialSegmentFormData();
      state.path = [];
      state.loading = false;
      state.error = null;
    },
    setSegmentLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setSegmentError: (state, action: PayloadAction<unknown | null>) => {
      state.error = action.payload;
    },
    clearSegmentForm: (state: any) => {
      state.formData = createInitialSegmentFormData();
      state.error = null;
      state.loading = false;
      state.path = [];
    },
    updateSegmentFormData: (
      state,
      action: PayloadAction<Partial<SegmentFormData>>,
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
  openSegmentForm,
  closeSegmentForm,
  setSegmentLoading,
  setSegmentError,
  clearSegmentForm,
  updateSegmentFormData,
} = segmentModalSlice.actions;

export default segmentModalSlice.reducer;

// Selector para obtener el estado completo del segmento
export const selectSegmentState = (state: { segmentModal: SegmentModalState }) =>
  state.segmentModal;


