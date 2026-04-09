import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface InsuranceConfigModalState {
  isOpen: boolean;
  initialValues: any | null;
}

interface InsuranceConfigModalRootState {
  insuranceConfigModal: InsuranceConfigModalState;
}

const initialState: InsuranceConfigModalState = {
  isOpen: false,
  initialValues: null,
};

const insuranceConfigModalSlice = createSlice({
  name: 'insuranceConfigModal',
  initialState,
  reducers: {
    openInsuranceConfigModal: (
      state: InsuranceConfigModalState,
      action: PayloadAction<any>,
    ) => {
      state.isOpen = true;
      state.initialValues = action.payload;
    },
    closeInsuranceConfigModal: (state: InsuranceConfigModalState) => {
      state.isOpen = false;
      state.initialValues = null;
    },
  },
});

export const { openInsuranceConfigModal, closeInsuranceConfigModal } =
  insuranceConfigModalSlice.actions;
export default insuranceConfigModalSlice.reducer;

export const selectInsuranceConfigModal = (
  state: InsuranceConfigModalRootState,
) => state.insuranceConfigModal;
