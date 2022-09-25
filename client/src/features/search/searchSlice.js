import {createSlice} from '@reduxjs/toolkit'

const initialState = {
    search: ''
}

export const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        setSearchData: (state, action) => state.search = action.payload
    }
})

export const {setSearchData } = searchSlice.actions;

//selectors
export const selectDataSearch = (state) => state.search.search;

export default searchSlice.reducer