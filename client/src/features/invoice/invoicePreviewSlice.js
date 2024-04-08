// src/features/invoicePreview/invoicePreviewSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: null,
  isOpen: false,
};

export const invoicePreviewSlice = createSlice({
  name: 'invoicePreview',
  initialState,
  reducers: {
    openInvoicePreviewModal: (state, action) => {
      state.data = action.payload;
      state.isOpen = true;
    },
    closeInvoicePreviewModal: (state) => {
      state.data = null;
      state.isOpen = false;
    },
  },
});

export const { openInvoicePreviewModal, closeInvoicePreviewModal } = invoicePreviewSlice.actions;

export const selectInvoiceData = (state) => state.invoicePreview.data;
export const selectInvoicePreview = (state) => state.invoicePreview;
export const selectIsModalOpen = (state) => state.invoicePreview.isModalOpen;

export default invoicePreviewSlice.reducer;
