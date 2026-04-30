import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Business {
  id: string;
  name: string;
  [key: string]: any;
}

interface BusinessState {
  data: Business | null;
  loading: boolean;
  loadingBusinessId: string | null;
}

interface BusinessRootState {
  business: BusinessState;
}

const initialState: BusinessState = {
  data: null,
  loading: false,
  loadingBusinessId: null,
};

export const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    setBusinessLoading: (
      state: BusinessState,
      action: PayloadAction<string | null>,
    ) => {
      state.loading = Boolean(action.payload);
      state.loadingBusinessId = action.payload;
    },
    setBusiness: (
      state: BusinessState,
      action: PayloadAction<Business | null>,
    ) => {
      state.data = action.payload;
      state.loading = false;
      state.loadingBusinessId = null;
    },
  },
});

export const { setBusiness, setBusinessLoading } = businessSlice.actions;

//selectors
export const selectBusinessData = (state: BusinessRootState) =>
  state.business.data;

export const selectBusinessLoading = (state: BusinessRootState) =>
  state.business.loading;

export const selectBusinessLoadingId = (state: BusinessRootState) =>
  state.business.loadingBusinessId;

export default businessSlice.reducer;
