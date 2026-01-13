import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  data: null,
};

export const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    setBusiness: (state: any, action: PayloadAction<any>) => {
      state.data = action.payload;
    },
  },
});

export const { setBusiness } = businessSlice.actions;

//selectors
export const selectBusinessData = (state) => state.business.data;

export default businessSlice.reducer;


