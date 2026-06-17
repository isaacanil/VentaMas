import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  readStoredTheme,
  writeStoredTheme,
} from './utils/themeStorage';

const theme = readStoredTheme();

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    mode: theme,
  },
  reducers: {
    toggleTheme: (state: any) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      writeStoredTheme(state.mode);
    },
    setTheme: (state: any, action: PayloadAction<any>) => {
      state.mode = action.payload;
      if (state.mode === 'dark') {
        writeStoredTheme('light');
      } else {
        writeStoredTheme('dark');
      }
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;

export const selectThemeMode = (state) => state.theme.mode;
