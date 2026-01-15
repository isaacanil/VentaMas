import {
  createSlice, type PayloadAction,
} from '@reduxjs/toolkit';

interface UserNotificationState {
  currentDialog: {
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: (() => void) | null;
    btnSubmitName: string | null;
    btnCancelName: string | null;
  };
}

interface UserNotificationRootState {
  userNotification: UserNotificationState;
}

const initialState: UserNotificationState = {
  currentDialog: {
    isOpen: false,
    title: '[title]',
    description: '[Description]',
    onConfirm: null,
    btnSubmitName: null,
    btnCancelName: null,
  },
};

const UserNotificationSlice = createSlice({
  name: 'userNotification',
  initialState,
  reducers: {
    setUserNotification: (state: UserNotificationState, action: PayloadAction<UserNotificationState['currentDialog']>) => {
      state.currentDialog = action.payload;
    },
    closeUserNotification: (state: UserNotificationState) => {
      state.currentDialog = {
        isOpen: false,
        title: 'Titulo',
        description: 'Descripcion',
        onConfirm: null,
        btnSubmitName: null,
        btnCancelName: null,
      };
    },
  },
});

export const { setUserNotification, closeUserNotification } =
  UserNotificationSlice.actions;

export default UserNotificationSlice.reducer;

export const selectCurrentUserNotification = (state: UserNotificationRootState) =>
  state.userNotification.currentDialog;
