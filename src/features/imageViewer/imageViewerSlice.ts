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
    openImageViewer: (state: ImageViewerState, action: PayloadAction<{ images: string[]; index?: number }>) => {
      state.isOpen = true;
      state.images = action.payload.images;
      state.currentIndex = action.payload.index || 0;
    },
    closeImageViewer: (state: ImageViewerState) => {
      state.isOpen = false;
      state.images = [];
      state.currentIndex = 0;
    },
    setCurrentIndex: (state: ImageViewerState, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },
    toggleImageViewer: (state: ImageViewerState, action: PayloadAction<{ show: boolean; url?: string }>) => {
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

export const { openImageViewer, closeImageViewer, setCurrentIndex, toggleImageViewer } = imageViewerSlice.actions;
export default imageViewerSlice.reducer;

export const selectImageViewerState = (state: ImageViewerRootState) => state.imageViewer;
export const selectIsOpen = (state: ImageViewerRootState) => state.imageViewer.isOpen;
export const selectImageViewerShow = (state: ImageViewerRootState) => state.imageViewer.isOpen;
export const selectImages = (state: ImageViewerRootState) => state.imageViewer.images;
export const selectCurrentIndex = (state: ImageViewerRootState) => state.imageViewer.currentIndex;
export const selectImageViewerURL = (state: ImageViewerRootState) => {
  const { images, currentIndex } = state.imageViewer;
  return images[currentIndex] || '';
};
