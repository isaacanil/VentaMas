import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UploadImageState {
  img: any;
  url: string | null;
  loading: boolean;
  status: number;
}

interface UploadImageRootState {
  uploadImg: UploadImageState;
}

const initialState: UploadImageState = {
  img: null,
  url: null,
  loading: false,
  status: 0,
};

export const UploadImgSlice = createSlice({
  name: 'uploadImg',
  initialState,
  reducers: {
    SaveImg: (
      state: UploadImageState,
      action: PayloadAction<{ img?: any; url?: string | null }>,
    ) => {
      const { img, url } = action.payload;
      if (img) {
        state.img = img;
      }
      if (url) {
        state.url = url;
      }
    },
    clearImg: (state: UploadImageState) => {
      state.img = null;
      state.url = null;
    },
    UploadProgress: (
      state: UploadImageState,
      action: PayloadAction<{ progress?: number }>,
    ) => {
      const { progress } = action.payload;
      state.status = progress || 0;
    },
    UploadImgLoading: (
      state: UploadImageState,
      action: PayloadAction<boolean>,
    ) => {
      state.loading = action.payload;
    },
  },
});

export const { SaveImg, clearImg, UploadImgLoading, UploadProgress } =
  UploadImgSlice.actions;

export const selectImg = (state: UploadImageRootState) => state.uploadImg.img;
export const selectUploadImageUrl = (state: UploadImageRootState) =>
  state.uploadImg.url;
export const selectUploadImageLoading = (state: UploadImageRootState) =>
  state.uploadImg.loading;
export const selectUploadImageStatus = (state: UploadImageRootState) =>
  state.uploadImg.status;

export default UploadImgSlice.reducer;
