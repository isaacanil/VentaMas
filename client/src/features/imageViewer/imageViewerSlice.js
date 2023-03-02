import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  show: false,
  url: "",
};

const imageViewerSlice = createSlice({
  name: "imageViewer",
  initialState,
  reducers: {
    toggleImageViewer: (state, action) => {
      const { show, url } = action.payload;
      state.show = show;
      state.url = url || "";
    },
  },
});

export const { toggleImageViewer } = imageViewerSlice.actions;
export default imageViewerSlice.reducer;
export const selectImageViewerShow = (state) => state.imageViewer.show;
export const selectImageViewerURL = (state) => state.imageViewer.url;