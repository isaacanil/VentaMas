import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
};

const navSlice = createSlice({
  name: 'nav',
  initialState,
  reducers: {
    setMenuOpen: (state: any, action: PayloadAction<any>) => {
      state.isOpen = Boolean(action.payload);
    },
    toggleMenu: (state: any) => {
      state.isOpen = !state.isOpen;
    },
    closeMenu: (state: any) => {
      state.isOpen = false;
    },
  },
});

export const { setMenuOpen, toggleMenu, closeMenu } = navSlice.actions;

export const selectMenuOpenStatus = (state) => state.nav.isOpen;

export default navSlice.reducer;


