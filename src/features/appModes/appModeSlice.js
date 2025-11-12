import { createSlice } from '@reduxjs/toolkit';

import { CONFIG } from '../../constants/appConfig';

const appModeSlice = createSlice({
  name: 'appMode',
  initialState: {
    mode: false, // false = modo producción, true = modo prueba
    notificationMode: CONFIG.APP_MODE.TEST_MODE,
  },
  reducers: {
    toggleMode: (state) => {
      const mode = state.mode;
      state.mode = !mode;
    },
  },
});

export const { toggleMode } = appModeSlice.actions;
export const selectAppMode = (state) => state.app.mode;
export default appModeSlice.reducer;
