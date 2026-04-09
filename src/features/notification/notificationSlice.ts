import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
  currentNotification: {
    title: string;
    message: string;
    visible: boolean;
    type: string | null;
  };
}

interface NotificationRootState {
  notification: NotificationState;
}

const initialState: NotificationState = {
  currentNotification: { title: '', message: '', visible: false, type: null },
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (
      state: NotificationState,
      action: PayloadAction<{
        message: string;
        title: string;
        type: string | null;
      }>,
    ) => {
      const { message, title, type } = action.payload;
      state.currentNotification = { message, title, type, visible: true };
    },
    removeNotification: (state: NotificationState) => {
      state.currentNotification = {
        title: '',
        message: '',
        visible: false,
        type: null,
      };
    },
  },
});
export const { addNotification, removeNotification } =
  notificationSlice.actions;

export default notificationSlice.reducer;

export const selectCurrentNotification = (state: NotificationRootState) =>
  state.notification.currentNotification;
