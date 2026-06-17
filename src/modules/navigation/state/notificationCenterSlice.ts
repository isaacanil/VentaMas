import { createSlice } from '@reduxjs/toolkit';

interface NotificationCenterState {
  isOpen: boolean;
}

interface NotificationCenterRootState {
  notificationCenter: NotificationCenterState;
}

const initialState: NotificationCenterState = {
  isOpen: false,
};

export const notificationCenterSlice = createSlice({
  name: 'notificationCenter',
  initialState,
  reducers: {
    openNotificationCenter: (state: NotificationCenterState) => {
      state.isOpen = true;
    },
    closeNotificationCenter: (state: NotificationCenterState) => {
      state.isOpen = false;
    },
  },
});

export const { openNotificationCenter, closeNotificationCenter } =
  notificationCenterSlice.actions;

export const selectNotificationCenter = (state: NotificationCenterRootState) =>
  state.notificationCenter;

export default notificationCenterSlice.reducer;
