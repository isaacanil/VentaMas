import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentNotification: { title: '', message: '', visible: false, type: null }
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      // Validación de entrada
      const { message, title, type } = action.payload;
      state.currentNotification = { message, title, type,  visible: true };
    },
    removeNotification: (state) => {
      state.currentNotification = { title: '', message: '', visible: false, type: null };
    }
  }
});
export const { addNotification, removeNotification } = notificationSlice.actions;

export default notificationSlice.reducer;

export const selectCurrentNotification = (state) => state.notification.currentNotification;