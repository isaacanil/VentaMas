import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';

import { applyUpdates } from '@/utils/reduxStateUtils';

interface InsuranceAR {
  id: string;
  invoiceId: string;
  clientId: string;
  paymentFrequency: string;
  totalInstallments: number;
  installmentAmount: number;
  paymentDate: number;
  lastPaymentDate: number | null;
  lastPayment: number;
  totalReceivable: number;
  currentBalance: number;
  arBalance: number;
  isClosed: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
  comments: string;
  type: string;
}

interface InsuranceARState {
  insuranceAR: InsuranceAR;
  error: string | null;
  loading: boolean;
}

interface InsuranceARRootState {
  insuranceAccountsReceivable: InsuranceARState;
}

const defaultInsuranceAR: InsuranceAR = {
  id: '',
  invoiceId: '',
  clientId: '',
  paymentFrequency: 'monthly',
  totalInstallments: 1,
  installmentAmount: 0.0,
  paymentDate: DateTime.now().toMillis(),
  lastPaymentDate: null,
  lastPayment: 0.0,
  totalReceivable: 0.0,
  currentBalance: 0.0,
  arBalance: 0.0,
  isClosed: false,
  isActive: true,
  createdAt: DateTime.now().toMillis(),
  updatedAt: DateTime.now().toMillis(),
  createdBy: '',
  updatedBy: '',
  comments: '',
  type: 'insurance',
};

// Initial state for the slice
const initialState: InsuranceARState = {
  insuranceAR: { ...defaultInsuranceAR },
  error: null,
  loading: false,
};

// Create the slice
const insuranceAccountsReceivableSlice = createSlice({
  name: 'insuranceAccountsReceivable',
  initialState,
  reducers: {
    setInsuranceAR(state: InsuranceARState, action: PayloadAction<Partial<InsuranceAR>>) {
      const hasUpdated = applyUpdates(state.insuranceAR, action.payload);
      if (!hasUpdated) state.insuranceAR.updatedAt = DateTime.now().toMillis();
      state.error = null;
    },
    resetInsuranceAR(state: InsuranceARState) {
      state.insuranceAR = { ...defaultInsuranceAR };
      state.error = null;
      state.loading = false;
    },
    setError(state: InsuranceARState, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setLoading(state: InsuranceARState, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

// Export action creators
export const { setInsuranceAR, resetInsuranceAR, setError, setLoading } =
  insuranceAccountsReceivableSlice.actions;

// Export selector
export const selectInsuranceAR = (state: InsuranceARRootState) =>
  state?.insuranceAccountsReceivable?.insuranceAR || defaultInsuranceAR;

// Export reducer
export default insuranceAccountsReceivableSlice.reducer;
