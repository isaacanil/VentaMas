import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
};

const navSlice = (createSlice as any)({
  name: 'nav',
  initialState,
  reducers: {
    setMenuOpen: (state, action) => {
      state.isOpen = Boolean(action.payload);
    },
    toggleMenu: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeMenu: (state) => {
      state.isOpen = false;
    },
  },
});

export const { setMenuOpen, toggleMenu, closeMenu } = navSlice.actions;

export const selectMenuOpenStatus = (state) => state.nav.isOpen;

export default navSlice.reducer;

