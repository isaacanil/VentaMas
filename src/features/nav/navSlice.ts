import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface NavState {
  isOpen: boolean;
}

interface NavRootState {
  nav: NavState;
}

const initialState: NavState = {
  isOpen: false,
};

const navSlice = createSlice({
  name: 'nav',
  initialState,
  reducers: {
    setMenuOpen: (state: NavState, action: PayloadAction<boolean>) => {
      state.isOpen = Boolean(action.payload);
    },
    toggleMenu: (state: NavState) => {
      state.isOpen = !state.isOpen;
    },
    closeMenu: (state: NavState) => {
      state.isOpen = false;
    },
  },
});

export const { setMenuOpen, toggleMenu, closeMenu } = navSlice.actions;

export const selectMenuOpenStatus = (state: NavRootState) => state.nav.isOpen;

export default navSlice.reducer;
