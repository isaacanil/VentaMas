import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  currentNotification: { title: '', message: '', visible: false, type: null }
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const { message, title, type, actionButton } = action.payload;
      const newNotification = { message, title, type, actionButton, visible: true };
      state.notifications.push(newNotification);
      if (!state.currentNotification.visible) {
        state.currentNotification = newNotification;
      }
    },
    removeNotification: (state) => {
      state.notifications.shift();
      state.currentNotification = state.notifications.length > 0 ? state.notifications[0] : { title: '', message: '', visible: false, type: null, actionButton: null };
    }
  }
});
export const { addNotification, removeNotification } = notificationSlice.actions;

export const selectCurrentNotification = (state) => state.notification.currentNotification;
export const selectNotificationQueue = (state) => state.notification.notifications;

export default notificationSlice.reducer;
