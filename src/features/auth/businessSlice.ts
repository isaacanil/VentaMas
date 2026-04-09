import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Business {
  id: string;
  name: string;
  [key: string]: any;
}

interface BusinessState {
  data: Business | null;
}

interface BusinessRootState {
  business: BusinessState;
}

const initialState: BusinessState = {
  data: null,
};

export const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    setBusiness: (
      state: BusinessState,
      action: PayloadAction<Business | null>,
    ) => {
      state.data = action.payload;
    },
  },
});

export const { setBusiness } = businessSlice.actions;

//selectors
export const selectBusinessData = (state: BusinessRootState) =>
  state.business.data;

export default businessSlice.reducer;
