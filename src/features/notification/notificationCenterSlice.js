import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
};

export const notificationCenterSlice = createSlice({
  name: 'notificationCenter',
  initialState,
  reducers: {
    openNotificationCenter: (state) => {
      state.isOpen = true;
    },
    closeNotificationCenter: (state) => {
      state.isOpen = false;
    },
  },
});

export const {
  openNotificationCenter,
  closeNotificationCenter,
  setActiveModule,
} = notificationCenterSlice.actions;

export const selectNotificationCenter = (state) => state.notificationCenter;

export default notificationCenterSlice.reducer;
