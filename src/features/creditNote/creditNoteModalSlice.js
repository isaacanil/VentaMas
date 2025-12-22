import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  selectedInvoice: null,
  selectedClient: null,
  mode: 'create', // 'create', 'edit', 'view'
  creditNoteData: null,
};

const creditNoteModalSlice = createSlice({
  name: 'creditNoteModal',
  initialState,
  reducers: {
    openCreditNoteModal: (state, action) => {
      state.isOpen = true;
      state.mode = action.payload?.mode || 'create';
      state.selectedInvoice = action.payload?.invoice || null;
      state.selectedClient = action.payload?.client || null;
      state.creditNoteData = action.payload?.creditNoteData || null;
    },
    closeCreditNoteModal: (state) => {
      state.isOpen = false;
      state.selectedInvoice = null;
      state.selectedClient = null;
      state.creditNoteData = null;
      state.mode = 'create';
    },
    setSelectedInvoice: (state, action) => {
      state.selectedInvoice = action.payload;
    },
    setSelectedClient: (state, action) => {
      state.selectedClient = action.payload;
    },
    setCreditNoteData: (state, action) => {
      state.creditNoteData = action.payload;
    },
  },
});

export const {
  openCreditNoteModal,
  closeCreditNoteModal,
  setSelectedInvoice,
  setSelectedClient,
  setCreditNoteData,
} = creditNoteModalSlice.actions;

export const selectCreditNoteModal = (state) => state.creditNoteModal;

export default creditNoteModalSlice.reducer;
