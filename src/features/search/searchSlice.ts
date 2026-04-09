import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SearchState {
  search: string;
}

interface SearchRootState {
  search: SearchState;
}

const initialState: SearchState = {
  search: '',
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchData: (state: SearchState, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
  },
});

export const { setSearchData } = searchSlice.actions;

//selectors
export const selectDataSearch = (state: SearchRootState) => state.search.search;

export default searchSlice.reducer;
