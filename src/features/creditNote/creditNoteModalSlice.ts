import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CreditNoteModalState {
  isOpen: boolean;
  selectedInvoice: any | null;
  selectedClient: any | null;
  mode: 'create' | 'edit' | 'view';
  creditNoteData: any | null;
}

interface CreditNoteModalRootState {
  creditNoteModal: CreditNoteModalState;
}

const initialState: CreditNoteModalState = {
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
    openCreditNoteModal: (
      state: CreditNoteModalState,
      action: PayloadAction<
        | {
            mode?: 'create' | 'edit' | 'view';
            invoice?: any;
            client?: any;
            creditNoteData?: any;
          }
        | undefined
      >,
    ) => {
      state.isOpen = true;
      state.mode = action.payload?.mode || 'create';
      state.selectedInvoice = action.payload?.invoice || null;
      state.selectedClient = action.payload?.client || null;
      state.creditNoteData = action.payload?.creditNoteData || null;
    },
    closeCreditNoteModal: (state: CreditNoteModalState) => {
      state.isOpen = false;
      state.selectedInvoice = null;
      state.selectedClient = null;
      state.creditNoteData = null;
      state.mode = 'create';
    },
    setSelectedInvoice: (
      state: CreditNoteModalState,
      action: PayloadAction<any>,
    ) => {
      state.selectedInvoice = action.payload;
    },
    setSelectedClient: (
      state: CreditNoteModalState,
      action: PayloadAction<any>,
    ) => {
      state.selectedClient = action.payload;
    },
    setCreditNoteData: (
      state: CreditNoteModalState,
      action: PayloadAction<any>,
    ) => {
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

export const selectCreditNoteModal = (state: CreditNoteModalRootState) =>
  state.creditNoteModal;

export default creditNoteModalSlice.reducer;
