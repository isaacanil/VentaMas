// store.js
import { createSlice } from '@reduxjs/toolkit';

const noteSlice = createSlice({
    name: 'note',
    initialState: {
        isOpen: false,
        note: null,
    },
    reducers: {
        setNote: (state, action) => {
            const { isOpen, note } = action.payload;
            state.isOpen = isOpen;
            state.note = note;
        },
        clearNote: (state) => {
            state.note = null;
            state.isOpen = false;
        }
    },
});

export const { setNote, clearNote } = noteSlice.actions;
export default noteSlice.reducer;

export const selectNote = (state) => state.note;