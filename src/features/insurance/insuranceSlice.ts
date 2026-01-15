import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Insurance {
  id: string;
  name: string;
  [key: string]: any;
}

interface InsuranceState {
  selectedInsurance: Insurance | null;
  insuranceList: Insurance[];
  recurrence: boolean;
  authNumber: string;
}

interface InsuranceRootState {
  insurance: InsuranceState;
}

const initialState: InsuranceState = {
  selectedInsurance: null,
  insuranceList: [],
  recurrence: false,
  authNumber: '',
};

const insuranceSlice = createSlice({
  name: 'insurance',
  initialState,
  reducers: {
    setSelectedInsurance: (state: InsuranceState, action: PayloadAction<Insurance | null>) => {
      state.selectedInsurance = action.payload;
    },
    setInsuranceList: (state: InsuranceState, action: PayloadAction<Insurance[]>) => {
      state.insuranceList = action.payload;
    },
    updateInsuranceData: (state: InsuranceState, action: PayloadAction<Partial<InsuranceState>>) => {
      return { ...state, ...action.payload };
    },
    clearInsurance: (state: InsuranceState) => {
      state.selectedInsurance = null;
      state.recurrence = false;
      state.authNumber = '';
    },
  },
});

export const { setSelectedInsurance, setInsuranceList, updateInsuranceData, clearInsurance } = insuranceSlice.actions;
export default insuranceSlice.reducer;

export const selectSelectedInsurance = (state: InsuranceRootState) => state.insurance.selectedInsurance;
export const selectInsuranceList = (state: InsuranceRootState) => state.insurance.insuranceList;
export const selectInsuranceData = (state: InsuranceRootState) => state.insurance;
