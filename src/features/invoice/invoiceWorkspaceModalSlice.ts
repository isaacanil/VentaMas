import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { InvoiceData } from '@/types/invoice';

export type InvoiceWorkspaceModalMode =
  | 'overview'
  | 'products'
  | 'payments'
  | 'relations';

interface InvoiceWorkspaceModalState {
  data: InvoiceData | null;
  isOpen: boolean;
  mode: InvoiceWorkspaceModalMode;
}

interface InvoiceWorkspaceModalRootState {
  invoiceWorkspaceModal: InvoiceWorkspaceModalState;
}

type OpenInvoiceWorkspacePayload =
  | InvoiceData
  | {
      invoice: InvoiceData;
      mode?: InvoiceWorkspaceModalMode;
    };

const initialState: InvoiceWorkspaceModalState = {
  data: null,
  isOpen: false,
  mode: 'overview',
};

const resolveOpenPayload = (
  payload: OpenInvoiceWorkspacePayload,
): { invoice: InvoiceData; mode: InvoiceWorkspaceModalMode } => {
  const maybeWrappedPayload = payload as {
    invoice?: InvoiceData;
    mode?: InvoiceWorkspaceModalMode;
  };

  if (maybeWrappedPayload.invoice) {
    return {
      invoice: maybeWrappedPayload.invoice,
      mode: maybeWrappedPayload.mode ?? 'overview',
    };
  }

  return {
    invoice: payload,
    mode: 'overview',
  };
};

export const invoiceWorkspaceModalSlice = createSlice({
  name: 'invoiceWorkspaceModal',
  initialState,
  reducers: {
    openInvoiceWorkspaceModal: (
      state,
      action: PayloadAction<OpenInvoiceWorkspacePayload>,
    ) => {
      const { invoice, mode } = resolveOpenPayload(action.payload);
      state.data = invoice;
      state.mode = mode;
      state.isOpen = true;
    },
    closeInvoiceWorkspaceModal: (state) => {
      state.data = null;
      state.mode = 'overview';
      state.isOpen = false;
    },
    updateInvoiceWorkspaceModalData: (
      state,
      action: PayloadAction<InvoiceData>,
    ) => {
      state.data = action.payload;
    },
  },
});

export const {
  openInvoiceWorkspaceModal,
  closeInvoiceWorkspaceModal,
  updateInvoiceWorkspaceModalData,
} = invoiceWorkspaceModalSlice.actions;

export const selectInvoiceWorkspaceModal = (
  state: InvoiceWorkspaceModalRootState,
) => state.invoiceWorkspaceModal;

export default invoiceWorkspaceModalSlice.reducer;
