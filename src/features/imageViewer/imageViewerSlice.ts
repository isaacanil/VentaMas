import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ImageViewerState {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
}

interface ImageViewerRootState {
  imageViewer: ImageViewerState;
}

const initialState: ImageViewerState = {
  isOpen: false,
  images: [],
  currentIndex: 0,
};

const imageViewerSlice = createSlice({
  name: 'imageViewer',
  initialState,
  reducers: {
    toggleImageViewer: (
      state: ImageViewerState,
      action: PayloadAction<{ show: boolean; url?: string }>,
    ) => {
      state.isOpen = action.payload.show;
      if (action.payload.show && action.payload.url) {
        state.images = [action.payload.url];
        state.currentIndex = 0;
      } else if (!action.payload.show) {
        state.images = [];
        state.currentIndex = 0;
      }
    },
  },
});

export const { toggleImageViewer } = imageViewerSlice.actions;
export default imageViewerSlice.reducer;

export const selectImageViewerShow = (state: ImageViewerRootState) =>
  state.imageViewer.isOpen;
export const selectImageViewerURL = (state: ImageViewerRootState) => {
  const { images, currentIndex } = state.imageViewer;
  return images[currentIndex] || '';
};
