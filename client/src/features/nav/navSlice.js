import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    isOpen: false
};
const navSlice = createSlice({
    name: 'nav',
    initialState,
    reducers: {
        toggleOpenMenu: (state, actions) => {
            let isOpen = actions.payload || !state.isOpen;
            state.isOpen = isOpen;
        },
        closeMenu: (state) => {
            state.isOpen = false;
        }
    }
});

export const { toggleOpenMenu, closeMenu } = navSlice.actions;

export const selectMenuOpenStatus = state => state.nav.isOpen;

export default navSlice.reducer;