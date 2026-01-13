// store.js
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const noteSlice = createSlice({
  name: 'note',
  initialState: {
    isOpen: false,
    note: null,
  },
  reducers: {
    setNote: (state: any, action: PayloadAction<any>) => {
      const { isOpen, note } = action.payload;
      state.isOpen = isOpen;
      state.note = note;
    },
    clearNote: (state: any) => {
      state.note = null;
      state.isOpen = false;
    },
  },
});

export const { setNote, clearNote } = noteSlice.actions;
export default noteSlice.reducer;

export const selectNote = (state) => state.note;


