import { createSlice } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { colorTheme } from './colorTheme';
import { style } from './style';

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    mode: 'light',
    color: colorTheme.light,
    style
  },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      state.color = state.mode === 'light' ? colorTheme.light : colorTheme.dark;
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;


export const colorPalette = () => useSelector(state => state.theme.color);


