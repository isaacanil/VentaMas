import {createSlice} from '@reduxjs/toolkit'

const initialState = [
    
]

export const displayControlSlice = createSlice({
    name: 'display',
    initialState,
    reducers: {
        addDisplay: (state, action) => {
            state.display = action.payload
        }
    }
})

export const {
    setSearchData 
} = displayControlSlice.actions;

//selectors
export const SelectDisplay = (state) => state.search.search;

export default searchSlice.reducer