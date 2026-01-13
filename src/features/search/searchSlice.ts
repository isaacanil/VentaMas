import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  search: '',
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchData: (state: any, action: PayloadAction<any>) => (state.search = action.payload),
  },
});

export const { setSearchData } = searchSlice.actions;

//selectors
export const selectDataSearch = (state) => state.search.search;

export default searchSlice.reducer;


