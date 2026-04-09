import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { CONFIG } from '@/constants/appConfig';

interface AppModeState {
  mode: boolean;
  notificationMode: boolean;
  cashRegisterAlertBypass: boolean;
}

interface AppModeRootState {
  app: AppModeState;
}

const initialState: AppModeState = {
  mode: false, // false = modo producción, true = modo prueba
  notificationMode: CONFIG.APP_MODE.TEST_MODE,
  cashRegisterAlertBypass: false,
};

export const CASH_REGISTER_ALERT_BYPASS_STORAGE_KEY =
  'devCashRegisterAlertBypass';

const readCashRegisterAlertBypass = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.localStorage.getItem(CASH_REGISTER_ALERT_BYPASS_STORAGE_KEY) ===
    'true'
  );
};

initialState.cashRegisterAlertBypass = readCashRegisterAlertBypass();

const appModeSlice = createSlice({
  name: 'appMode',
  initialState,
  reducers: {
    toggleMode: (state: AppModeState) => {
      state.mode = !state.mode;
    },
    setCashRegisterAlertBypass: (
      state: AppModeState,
      action: PayloadAction<boolean>,
    ) => {
      state.cashRegisterAlertBypass = action.payload;
    },
  },
});

export const { toggleMode, setCashRegisterAlertBypass } = appModeSlice.actions;
export const selectAppMode = (state: AppModeRootState) => state.app.mode;
export const selectCashRegisterAlertBypass = (state: AppModeRootState) =>
  state.app.cashRegisterAlertBypass;
export default appModeSlice.reducer;
