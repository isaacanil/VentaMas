// src/features/invoicePreview/invoicePreviewSlice.js

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface InvoicePreviewState {
  data: any | null;
  isOpen: boolean;
}

interface InvoicePreviewRootState {
  invoicePreview: InvoicePreviewState;
}

const initialState: InvoicePreviewState = {
  data: null,
  isOpen: false,
};

export const invoicePreviewSlice = createSlice({
  name: 'invoicePreview',
  initialState,
  reducers: {
    openInvoicePreviewModal: (state: InvoicePreviewState, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.isOpen = true;
    },
    closeInvoicePreviewModal: (state: InvoicePreviewState) => {
      state.data = null;
      state.isOpen = false;
    },
  },
});

export const { openInvoicePreviewModal, closeInvoicePreviewModal } =
  invoicePreviewSlice.actions;

export const selectInvoiceData = (state: InvoicePreviewRootState) => state.invoicePreview.data;
export const selectInvoicePreview = (state: InvoicePreviewRootState) => state.invoicePreview;
export const selectIsModalOpen = (state: InvoicePreviewRootState) => state.invoicePreview.isOpen;

export default invoicePreviewSlice.reducer;
