import {
  createSlice,
  type PayloadAction,
  createAsyncThunk,
} from '@reduxjs/toolkit';

import { getClientInsuranceByClientId } from '@/firebase/insurance/clientInsuranceService';

interface InsuranceAuthData {
  clientId: string | null;
  hasDependent: boolean;
  dependentId: string | null;
  insuranceId: string | null;
  insuranceType: string | null;
  affiliateNumber: string;
  authNumber: string;
  doctorId: string | null;
  doctor: string;
  specialty: string;
  indicationDate: any | null;
  birthDate: any | null;
  prescription: any | null;
}

interface InsuranceAuthState {
  authData: InsuranceAuthData;
  loading: boolean;
  error: string | null;
  modal: {
    open: boolean;
    initialValues: any | null;
  };
}

interface InsuranceAuthRootState {
  insuranceAuth: InsuranceAuthState;
}

const initialState: InsuranceAuthState = {
  authData: {
    clientId: null,
    hasDependent: false,
    dependentId: null,
    insuranceId: null,
    insuranceType: null,
    affiliateNumber: '',
    authNumber: '',
    doctorId: null,
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
export const fetchInsuranceAuthByClientId = (createAsyncThunk as any)(
  'insuranceAuth/fetchByClientId',
  async (
    { user, clientId }: { user: any; clientId: string },
    { rejectWithValue }: any,
  ) => {
    try {
      const insuranceData = await getClientInsuranceByClientId(user, clientId);
      if (insuranceData) {
        // Solo extraemos los campos específicos que necesitamos
        const { insuranceId, insuranceType, birthDate } = insuranceData;
        return { insuranceId, insuranceType, birthDate };
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const insuranceAuthSlice = createSlice({
  name: 'insuranceAuth',
  initialState,
  reducers: {
    setAuthData: (
      state: InsuranceAuthState,
      action: PayloadAction<Partial<InsuranceAuthData>>,
    ) => {
      state.authData = { ...state.authData, ...action.payload };
    },
    updateAuthField: (
      state: InsuranceAuthState,
      action: PayloadAction<{ field: keyof InsuranceAuthData; value: any }>,
    ) => {
      const { field, value } = action.payload;
      (state.authData[field] as any) = value;
    },
    clearAuthData: (state: InsuranceAuthState) => {
      state.authData = initialState.authData;
    },
    setLoading: (state: InsuranceAuthState, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (
      state: InsuranceAuthState,
      action: PayloadAction<string | null>,
    ) => {
      state.error = action.payload;
    },
    openModal: (
      state: InsuranceAuthState,
      action: PayloadAction<{ initialValues?: any } | undefined>,
    ) => {
      state.modal.open = true;
      if (action.payload?.initialValues) {
        // Actualiza el estado con los valores iniciales pasados al modal
        state.authData = { ...state.authData, ...action.payload.initialValues };
      }
    },
    closeModal: (
      state: InsuranceAuthState,
      action: PayloadAction<{ clearAuthData?: boolean } | undefined>,
    ) => {
      if (action.payload?.clearAuthData) {
        state.authData = initialState.authData;
      }
      state.modal.open = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchInsuranceAuthByClientId.pending,
        (state: InsuranceAuthState) => {
          state.loading = true;
          state.error = null;
        },
      )
      .addCase(
        fetchInsuranceAuthByClientId.fulfilled,
        (state: InsuranceAuthState, action: PayloadAction<any>) => {
          state.loading = false;
          if (action.payload) {
            // Solo actualiza los campos específicos manteniendo el resto del estado
            state.authData = {
              ...state.authData,
              ...action.payload,
            };
          }
        },
      )
      .addCase(
        fetchInsuranceAuthByClientId.rejected,
        (state: InsuranceAuthState, action: PayloadAction<any>) => {
          state.loading = false;
          state.error = action.payload;
        },
      );
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
export const selectInsuranceAuthData = (state: InsuranceAuthRootState) =>
  state.insuranceAuth.authData;
export const selectInsuranceAuthLoading = (state: InsuranceAuthRootState) =>
  state.insuranceAuth.loading;
export const selectInsuranceAuthError = (state: InsuranceAuthRootState) =>
  state.insuranceAuth.error;
export const selectInsuranceModal = (state: InsuranceAuthRootState) =>
  state.insuranceAuth.modal;

export default insuranceAuthSlice.reducer;
