import { createSlice } from '@reduxjs/toolkit';

import { CONFIG } from '@/constants/appConfig';

interface AppModeState {
  mode: boolean;
  notificationMode: boolean;
}

interface AppModeRootState {
  app: AppModeState;
}

const initialState: AppModeState = {
  mode: false, // false = modo producción, true = modo prueba
  notificationMode: CONFIG.APP_MODE.TEST_MODE,
};

const appModeSlice = createSlice({
  name: 'appMode',
  initialState,
  reducers: {
    toggleMode: (state: AppModeState) => {
      state.mode = !state.mode;
    },
  },
});

export const { toggleMode } = appModeSlice.actions;
export const selectAppMode = (state: AppModeRootState) => state.app.mode;
export default appModeSlice.reducer;
