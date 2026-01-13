import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  img: null,
  url: null,
  loading: false,
  status: 0,
};

export const UploadImgSlice = createSlice({
  name: 'uploadImg',
  initialState,
  reducers: {
    SaveImg: (state: any, action: PayloadAction<any>) => {
      const { img, url } = action.payload;
      if (img) {
        state.img = img;
      }
      if (url) {
        state.url = url;
      }
    },
    clearImg: (state: any) => {
      state.img = null;
      state.url = null;
    },
    UploadProgress: (state: any, action: PayloadAction<any>) => {
      const { progress } = action.payload;
      state.status = progress || 0;
    },
    UploadImgLoading: (state: any, action: PayloadAction<any>) => {
      state.loading = action.payload;
    },
  },
});

export const { SaveImg, clearImg, UploadImgLoading, UploadProgress } =
  UploadImgSlice.actions;

export const selectImg = (state) => state.uploadImg.img;
export const selectUploadImageUrl = (state) => state.uploadImg.url;
export const selectUploadImageLoading = (state) => state.uploadImg.loading;
export const selectUploadImageStatus = (state) => state.uploadImg.status;

export default UploadImgSlice.reducer;


