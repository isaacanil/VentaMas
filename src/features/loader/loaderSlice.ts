import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LoaderState {
  show: boolean;
  message: string;
}

interface LoaderRootState {
  loader: LoaderState;
}

const initialState: LoaderState = {
  show: false,
  message: '',
};

const loaderSlice = createSlice({
  name: 'loader',
  initialState,
  reducers: {
    toggleLoader: (state: LoaderState, action: PayloadAction<{ show: boolean; message?: string }>) => {
      const { show, message } = action.payload;
      state.show = show;
      state.message = message || '';
    },
  },
});

export const { toggleLoader } = loaderSlice.actions;
export default loaderSlice.reducer;
export const selectLoaderShow = (state: LoaderRootState) => state.loader.show;
export const selectLoaderMessage = (state: LoaderRootState) => state.loader.message;
