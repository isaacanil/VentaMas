import {createSlice} from '@reduxjs/toolkit'

const initialState = {
    data: null
}

export const businessSlice = createSlice({
    name: 'business',
    initialState,
    reducers: {
        setBusiness: (state, action) => {
            state.data = action.payload
        },
      
    }
})

export const { setBusiness } = businessSlice.actions;

//selectors
export const selectBusinessData = (state) => state.business.data;


export default businessSlice.reducer