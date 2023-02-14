import { createSlice } from "@reduxjs/toolkit";

const navSlice = createSlice({
    name: 'nav',
    initialState: {
        isOpen: false
    },
    reducers: { 
        toggleOpenMenu: (state, actions) => {
            let isOpen = actions.payload;
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