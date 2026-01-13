import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  show: false,
  message: '',
};

const loaderSlice = createSlice({
  name: 'loader',
  initialState,
  reducers: {
    toggleLoader: (state: any, action: PayloadAction<any>) => {
      const { show, message } = action.payload;
      state.show = show;
      state.message = message || '';
    },
  },
});

export const { toggleLoader } = loaderSlice.actions;
export default loaderSlice.reducer;
export const selectLoaderShow = (state) => state.loader.show;
export const selectLoaderMessage = (state) => state.loader.message;


