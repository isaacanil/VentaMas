import {
  createSlice,
  createSerializableStateInvariantMiddleware,
} from '@reduxjs/toolkit';

createSerializableStateInvariantMiddleware({
  isSerializable: (value) => typeof value !== 'function',
});

const initialState = {
  currentDialog: {
    isOpen: false,
    title: '[title]',
    description: '[Description]',
    onConfirm: null,
    btnSubmitName: null,
    btnCancelName: null,
  },
};

const UserNotificationSlice = (createSlice as any)({
  name: 'userNotification',
  initialState,
  reducers: {
    setUserNotification: (state, action) => {
      state.currentDialog = action.payload;
    },
    closeUserNotification: (state) => {
      const initialValue = {
        isOpen: false,
        title: 'Titulo',
        description: 'Descripcion',
        onConfirm: null,
      };
      state.currentDialog = initialValue;
    },
  },
});

export const { setUserNotification, closeUserNotification } =
  UserNotificationSlice.actions;

export default UserNotificationSlice.reducer;

export const selectCurrentUserNotification = (state) =>
  state.userNotification.currentDialog;

