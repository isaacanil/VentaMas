import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { fbDeleteClient } from '@/firebase/client/fbDeleteClient';
import { fbDeleteProduct } from '@/firebase/products/fbDeleteproduct';

interface AlertState {
  deleteProduct: {
    isOpen: boolean;
    isSuccess: boolean;
    id: string | null;
    user: any;
  };
  deleteClient: {
    isOpen: boolean;
    isSuccess: boolean;
    id: string | null;
    businessID: string | null;
  };
}

interface AlertRootState {
  alert: AlertState;
}

const initialState: AlertState = {
  deleteProduct: {
    isOpen: false,
    isSuccess: false,
    id: null,
    user: null,
  },
  deleteClient: {
    isOpen: false,
    isSuccess: false,
    id: null,
    businessID: null,
  },
};
export const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    handleDeleteProductAlert: (
      state: AlertState,
      actions: PayloadAction<{ id: string | null; user: any } | undefined>,
    ) => {
      const id = actions.payload?.id ?? null;
      const user = actions.payload?.user ?? null;
      const isOpen = state.deleteProduct.isOpen;

      state.deleteProduct.isOpen = !isOpen;
      state.deleteProduct.id = id;
      state.deleteProduct.user = user;
    },
    handleDeleteProductAlertSuccess: (state: AlertState) => {
      const id = state.deleteProduct.id;
      const user = state.deleteProduct.user;
      if (id && user) {
        fbDeleteProduct(user, id);
      }
    },
    handleDeleteClientAlert: (
      state: AlertState,
      actions: PayloadAction<
        { id: string | null; businessID: string | null } | undefined
      >,
    ) => {
      const id = actions.payload?.id ?? null;
      const businessID = actions.payload?.businessID ?? null;
      const isOpen = state.deleteClient.isOpen;
      state.deleteClient.isOpen = !isOpen;
      state.deleteClient.id = id;
      state.deleteClient.businessID = businessID;
    },
    handleDeleteClientAlertSuccess: (state: AlertState) => {
      const id = state.deleteClient.id;
      const businessID = state.deleteClient.businessID;
      if (id && businessID) {
        fbDeleteClient(businessID, id);
      }
    },
  },
});

export const {
  handleDeleteProductAlert,
  handleDeleteProductAlertSuccess,
  handleDeleteClientAlert,
  handleDeleteClientAlertSuccess,
} = alertSlice.actions;

//selectors
export const selectDeleteProductAlert = (state: AlertRootState) =>
  state.alert.deleteProduct;
export const selectDeleteClientAlert = (state: AlertRootState) =>
  state.alert.deleteClient.isOpen;

export default alertSlice.reducer;
