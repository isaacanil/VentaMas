// src/features/account/accountSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fbGetClientAccountsReceivable } from '../../firebase/client/fbGetClientAccountsReceivable';

// Async thunk to fetch accounts receivable
export const fetchAccountsReceivable = createAsyncThunk(
  'client/fetchAccountsReceivable',
  async ({ user, clientId }) => {
    return new Promise((resolve, reject) => {
      fbGetClientAccountsReceivable({
        user,
        clientId,
        onUpdate: resolve,
        onError: reject,
      });
    });
  }
);

const clientSlice = createSlice({
  name: 'client',
  initialState: {
    user: null,
    accountsReceivable: [],
    installments: [],
    payments: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    addCuota(state, action) {
      state.cuotas.push(action.payload);
    },
    addPago(state, action) {
      state.pagos.push(action.payload);
    },
    resetAccount(state) {
      state.user = null;
      state.accountsReceivable = [];
      state.cuotas = [];
      state.pagos = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountsReceivable.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAccountsReceivable.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.accountsReceivable = action.payload;
      })
      .addCase(fetchAccountsReceivable.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setUser, addCuota, addPago, resetAccount } = clientSlice.actions;

export default clientSlice.reducer;
