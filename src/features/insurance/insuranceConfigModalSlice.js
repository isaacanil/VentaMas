import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  initialValues: null,
};

const insuranceConfigModalSlice = createSlice({
  name: 'insuranceConfigModal',
  initialState,
  reducers: {
    openInsuranceConfigModal: (state, action) => {
      state.isOpen = true;
      state.initialValues = action.payload;
    },
    closeInsuranceConfigModal: (state) => {
      state.isOpen = false;
      state.initialValues = null;
    },
  },
});

export const { openInsuranceConfigModal, closeInsuranceConfigModal } =
  insuranceConfigModalSlice.actions;
export default insuranceConfigModalSlice.reducer;

export const selectInsuranceConfigModal = (state) => state.insuranceConfigModal;
