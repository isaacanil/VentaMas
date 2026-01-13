import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
};

export const notificationCenterSlice = createSlice({
  name: 'notificationCenter',
  initialState,
  reducers: {
    openNotificationCenter: (state: any) => {
      state.isOpen = true;
    },
    closeNotificationCenter: (state: any) => {
      state.isOpen = false;
    },
  },
});

export const {
  openNotificationCenter,
  closeNotificationCenter,
} = notificationCenterSlice.actions;

export const selectNotificationCenter = (state) => state.notificationCenter;

export default notificationCenterSlice.reducer;

