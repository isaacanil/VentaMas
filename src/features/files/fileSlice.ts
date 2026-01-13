import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  files: [],
  open: false,
};

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    openFileCenter: (state: any, action: PayloadAction<any>) => {
      const files = action.payload;
      if (files.length) {
        state.open = true;
        state.files = files;
      } else {
        state.open = false;
        state.files = [];
      }
    },
    closeFileCenter: (state: any) => {
      state.open = false;
      state.files = [];
    },
  },
});

export const {
  openFileCenter,
  closeFileCenter,
} = fileSlice.actions;

export default fileSlice.reducer;

export const selectFileCenter = (state) => state.files;


