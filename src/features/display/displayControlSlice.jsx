import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  display: null,
};

export const displayControlSlice = createSlice({
  name: 'display',
  initialState,
  reducers: {
    setDisplay(state, action) {
      state.display = action.payload;
    },
  },
});

export const { setDisplay } = displayControlSlice.actions;

// selectors
export const selectDisplay = (state) => state.display?.display ?? null;

export default displayControlSlice.reducer;
