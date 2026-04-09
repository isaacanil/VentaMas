// store.js
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface NoteState {
  isOpen: boolean;
  note: any | null;
}

interface NoteRootState {
  note: NoteState;
}

const initialState: NoteState = {
  isOpen: false,
  note: null,
};

const noteSlice = createSlice({
  name: 'note',
  initialState,
  reducers: {
    setNote: (
      state: NoteState,
      action: PayloadAction<{ isOpen: boolean; note: any }>,
    ) => {
      const { isOpen, note } = action.payload;
      state.isOpen = isOpen;
      state.note = note;
    },
    clearNote: (state: NoteState) => {
      state.note = null;
      state.isOpen = false;
    },
  },
});

export const { setNote, clearNote } = noteSlice.actions;
export default noteSlice.reducer;

export const selectNote = (state: NoteRootState) => state.note;
