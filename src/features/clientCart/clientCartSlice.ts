import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { fetchInsuranceAuthByClientId } from '@/features/insurance/insuranceAuthSlice';
import { fbAddClient } from '@/firebase/client/fbAddClient';
import { fbUpdateClient } from '@/firebase/client/fbUpdateClient';
import { compareObjectsByJSON } from '@/utils/object/compareObjects';

import { CLIENT_MODE_BAR } from './clientMode';

export const GenericClient = {
  name: 'Generic Client',
  tel: '',
  address: '',
  personalID: '',
  delivery: {
    status: false,
    value: 0,
  },
  id: 'GC-0000',
};
const EmptyClient = {
  name: '',
  tel: '',
  address: '',
  personalID: '',
  delivery: {
    status: false,
    value: 0,
  },
  id: '',
};

interface Client {
  name: string;
  tel: string;
  address: string;
  personalID: string;
  delivery: {
    status: boolean;
    value: number;
  };
  id: string;
  [key: string]: any;
}

interface ClientCartState {
  mode: string;
  labelClientMode: string;
  searchTerm: string;
  client: Client;
  copyClient: Client | null;
  isOpen: boolean;
  showClientList?: boolean;
}

interface ClientCartRootState {
  clientCart: ClientCartState;
  user: {
    userData: any;
  };
}

const initialState: ClientCartState = {
  mode: CLIENT_MODE_BAR.SEARCH.id,
  labelClientMode: CLIENT_MODE_BAR.SEARCH.label,
  searchTerm: '',
  client: GenericClient,
  copyClient: null,
  isOpen: false,
};

export const clientSlice = createSlice({
  name: 'clientCart',
  initialState,
  reducers: {
    setClient: (state: ClientCartState, action: PayloadAction<Partial<Client>>) => {
      state.client = { ...state.client, ...action.payload };
    },
    setClientMode: (state: ClientCartState, action: PayloadAction<string>) => {
      const { SEARCH, CREATE, UPDATE } = CLIENT_MODE_BAR;
      state.mode = action.payload;

      switch (true) {
        case state.mode === SEARCH.id:
          state.labelClientMode = SEARCH.label;
          state.showClientList = SEARCH.showClientList;
          state.isOpen = false;
          break;
        case state.mode === CREATE.id:
          state.labelClientMode = CREATE.label;
          state.client = EmptyClient;
          state.showClientList = CREATE.showClientList;
          state.isOpen = true;
          break;
        case state.mode === UPDATE.id:
          state.labelClientMode = UPDATE.label;
          state.showClientList = UPDATE.showClientList;
          state.isOpen = false;
          break;
        default:
          state.labelClientMode = SEARCH.label;
          state.showClientList = SEARCH.showClientList;
      }
    },
    setClientSearchTerm: (state: ClientCartState, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    addClient: (state: ClientCartState, action: PayloadAction<Client>) => {
      state.client = { ...action.payload };
      state.mode = CLIENT_MODE_BAR.UPDATE.id;
      state.copyClient = { ...action.payload };
    },
    setIsOpen: (state: ClientCartState, action: PayloadAction<boolean | undefined>) => {
      if (action.payload === undefined) {
        state.isOpen = !state.isOpen;
      } else {
        state.isOpen = action.payload;
      }
    },
    deleteClient: (state: ClientCartState) => {
      state.client = EmptyClient;
      state.isOpen = false;
      state.mode = CLIENT_MODE_BAR.SEARCH.id;
      state.labelClientMode = CLIENT_MODE_BAR.SEARCH.label;
    },
    handleClient: (state: ClientCartState, action: PayloadAction<{ user: any }>) => {
      const { user } = action.payload;
      if (!state.client.id) {
        state.client = GenericClient;
        return;
      }
      if (
        state?.copyClient !== null &&
        state?.copyClient?.id === state?.client?.id &&
        !compareObjectsByJSON(state?.client, state?.copyClient)
      ) {
        fbUpdateClient(user, state.client);
        return;
      }
      if (
        !state?.client?.id &&
        state?.client?.name.length > 0 &&
        state.client.name !== 'Cliente Genérico'
      ) {
        fbAddClient(user, state.client);
        return;
      }
    },
  },
});

// Create a thunk to handle both client selection and auth data fetching
export const selectClientWithAuth = (client: Client) => (dispatch: any, getState: any) => {
  dispatch(addClient(client));

  const user = getState().user.userData;

  if (client.id && user) {
    dispatch(
      fetchInsuranceAuthByClientId({
        user,
        clientId: client.id,
      }),
    );
  }
};

export const {
  setClient,
  setClientMode,
  setIsOpen,
  setClientSearchTerm,
  deleteClient,
  addClient,
  handleClient,
} = clientSlice.actions;

//selectors
export const selectClient = (state: ClientCartRootState) => state.clientCart.client;
export const selectClientMode = (state: ClientCartRootState) => state.clientCart.mode;
export const selectLabelClientMode = (state: ClientCartRootState) =>
  state.clientCart.labelClientMode;
export const selectIsOpen = (state: ClientCartRootState) => state.clientCart.isOpen;
export const selectClientSearchTerm = (state: ClientCartRootState) => state.clientCart.searchTerm;

export default clientSlice.reducer;
