import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  files: [],
  open: false,
};

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    openFileCenter: (state, action) => {
      const files = action.payload;
      if (files.length) {
        state.open = true;
        state.files = files;
      } else {
        state.open = false;
        state.files = [];
      }
    },
    closeFileCenter: (state) => {
      state.open = false;
      state.files = [];
    },
  },
});

export const {
  addFiles,
  removeFile,
  setAttachmentUrls,
  openFileCenter,
  closeFileCenter,
} = fileSlice.actions;

export default fileSlice.reducer;

export const selectFileCenter = (state) => state.files;
