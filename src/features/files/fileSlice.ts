import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface FileItem {
  id: string | number;
  [key: string]: any;
}

interface FileState {
  files: FileItem[];
  open: boolean;
}

interface FileRootState {
  files: FileState;
}

const initialState: FileState = {
  files: [],
  open: false,
};

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    openFileCenter: (state: FileState, action: PayloadAction<FileItem[]>) => {
      const files = action.payload;
      if (files.length) {
        state.open = true;
        state.files = files;
      } else {
        state.open = false;
        state.files = [];
      }
    },
    closeFileCenter: (state: FileState) => {
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

export const selectFileCenter = (state: FileRootState) => state.files;
