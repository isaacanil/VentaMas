import { createSlice } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';

import { applyUpdates } from '@/utils/reduxStateUtils';

const defaultInsuranceAR = {
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
const initialState = {
  insuranceAR: { ...defaultInsuranceAR },
  error: null,
  loading: false,
};

// Create the slice
const insuranceAccountsReceivableSlice = createSlice({
  name: 'insuranceAccountsReceivable',
  initialState,
  reducers: {
    setInsuranceAR(state, action) {
      const hasUpdated = applyUpdates(state.insuranceAR, action.payload);
      if (!hasUpdated) state.insuranceAR.updatedAt = DateTime.now().toMillis();
      state.error = null;
    },
    resetInsuranceAR(state) {
      state.insuranceAR = { ...defaultInsuranceAR };
      state.error = null;
      state.loading = false;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

// Export action creators
export const { setInsuranceAR, resetInsuranceAR, setError, setLoading } =
  insuranceAccountsReceivableSlice.actions;

// Export selector
export const selectInsuranceAR = (state) =>
  state?.insuranceAccountsReceivable?.insuranceAR || defaultInsuranceAR;

// Export reducer
export default insuranceAccountsReceivableSlice.reducer;

