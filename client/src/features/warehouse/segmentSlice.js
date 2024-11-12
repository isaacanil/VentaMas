
import { createSlice } from '@reduxjs/toolkit';

const segmentSlice = createSlice({
  name: 'segment',
  initialState: {
    segments: [],
    // ...other initial state
  },
  reducers: {
    // Define your reducers here
    addSegment: (state, action) => {
      state.segments.push(action.payload);
    },
    updateSegment: (state, action) => {
      const index = state.segments.findIndex(seg => seg.id === action.payload.id);
      if (index !== -1) {
        state.segments[index] = action.payload;
      }
    },
    // ...other reducers
  },
});

export const { addSegment, updateSegment } = segmentSlice.actions;
export default segmentSlice.reducer;