import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedInsurance: false,
  insuranceData: {
    recurrence: false,
    validity: false,
    authNumber: '',
  },
};

const insuranceSlice = createSlice({
  name: 'insurance',
  initialState,
  reducers: {
    setInsuranceStatus: (state, action) => {
      state.selectedInsurance = action.payload;
    },
    toggleInsurance: (state, action) => {
      // If explicit value provided, use it, otherwise toggle current value
      state.selectedInsurance = action.payload ?? !state.selectedInsurance;
    },
    updateInsuranceData: (state, action) => {
      state.insuranceData = { ...state.insuranceData, ...action.payload };
    },
  },
});

export const { setInsuranceStatus, toggleInsurance, updateInsuranceData } =
  insuranceSlice.actions;

export const selectInsuranceStatus = (state) =>
  state.insurance.selectedInsurance;
export const selectInsuranceData = (state) => state.insurance.insuranceData;

export default insuranceSlice.reducer;
