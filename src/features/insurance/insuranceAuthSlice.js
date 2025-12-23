import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { getClientInsuranceByClientId } from '@/firebase/insurance/clientInsuranceService';

const initialState = {
  authData: {
    clientId: null,
    hasDependent: false,
    dependentId: null,
    insuranceId: null,
    insuranceType: null,
    affiliateNumber: '',
    authNumber: '',
    doctor: '',
    specialty: '',
    indicationDate: null,
    birthDate: null,
    prescription: null,
  },
  loading: false,
  error: null,
  modal: {
    open: false,
    initialValues: null,
  },
};

// Thunk action to fetch insurance auth data by client ID
export const fetchInsuranceAuthByClientId = createAsyncThunk(
  'insuranceAuth/fetchByClientId',
  async ({ user, clientId }, { rejectWithValue }) => {
    try {
      const insuranceData = await getClientInsuranceByClientId(user, clientId);
      if (insuranceData) {
        // Solo extraemos los campos específicos que necesitamos
        const { insuranceId, insuranceType, birthDate } = insuranceData;
        return { insuranceId, insuranceType, birthDate };
      }
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const insuranceAuthSlice = createSlice({
  name: 'insuranceAuth',
  initialState,
  reducers: {
    setAuthData: (state, action) => {
      state.authData = { ...state.authData, ...action.payload };
    },
    updateAuthField: (state, action) => {
      const { field, value } = action.payload;
      state.authData[field] = value;
    },
    clearAuthData: (state) => {
      state.authData = initialState.authData;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    openModal: (state, action) => {
      state.modal.open = true;
      if (action.payload?.initialValues) {
        // Actualiza el estado con los valores iniciales pasados al modal
        state.authData = { ...state.authData, ...action.payload.initialValues };
      }
    },
    closeModal: (state, { payload: { clearAuthData = false } = {} }) => {
      if (clearAuthData) {
        state.authData = initialState.authData;
      }
      state.modal.open = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInsuranceAuthByClientId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInsuranceAuthByClientId.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Solo actualiza los campos específicos manteniendo el resto del estado
          state.authData = {
            ...state.authData,
            ...action.payload,
          };
        }
      })
      .addCase(fetchInsuranceAuthByClientId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  setAuthData,
  updateAuthField,
  clearAuthData,
  setLoading,
  setError,
  openModal,
  closeModal,
} = insuranceAuthSlice.actions;

// Selectors
export const selectInsuranceAuthData = (state) => state.insuranceAuth.authData;
export const selectInsuranceAuthLoading = (state) =>
  state.insuranceAuth.loading;
export const selectInsuranceAuthError = (state) => state.insuranceAuth.error;
export const selectInsuranceModal = (state) => state.insuranceAuth.modal;

export default insuranceAuthSlice.reducer;
