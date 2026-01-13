import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { fbDeleteClient } from '@/firebase/client/fbDeleteClient';
import { fbDeleteProduct } from '@/firebase/products/fbDeleteproduct';

const initialState = {
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
    handleDeleteProductAlert: (state: any, actions: PayloadAction<any>) => {
      const id = actions.payload?.id,
        user = actions.payload?.user,
        isOpen = state.deleteProduct.isOpen;

      state.deleteProduct.isOpen = !isOpen;
      state.deleteProduct.id = id;
      state.deleteProduct.user = user;
    },
    handleDeleteProductAlertSuccess: (state: any) => {
      const id = state.deleteProduct.id;
      const user = state.deleteProduct.user;
      fbDeleteProduct(user, id);
    },
    handleDeleteClientAlert: (state: any, actions: PayloadAction<any>) => {
      const id = actions.payload?.id;
      const businessID = actions.payload?.businessID;
      const isOpen = state.deleteProduct.isOpen;
      state.deleteProduct.isOpen = !isOpen;
      state.deleteProduct.id = id;
      state.deleteClient.businessID = businessID ?? null;
    },
    handleDeleteClientAlertSuccess: (state: any) => {
      const id = state.deleteClient.id;
      fbDeleteClient(state.deleteClient.businessID, id);
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
export const selectDeleteProductAlert = (state) => state.alert.deleteProduct;
export const selectDeleteClientAlert = (state) =>
  state.alert.deleteClient.isOpen;

export default alertSlice.reducer;


