import {createSlice} from '@reduxjs/toolkit'

const initialState = {
    name: '',
    amountToBuy: {unit: 1, amount: 1},
    category: '',
    cost: 0,
    id: '',
    netContent: '',
    price: 0,
    image: '',
    size: '',
    stock: 0,
    tax: {ref: '', value: 0, unit: 0, total: 0},
    type: '',
    discount: {unit: 1, total: 1},
}

export const addProductSlice = createSlice({
    name: 'addProduct',
    initialState,
    reducers: {
        addDisplay: (state, action) => {
            state.display = action.payload
        }
    }
})

export const {
    setSearchData 
} = addProductSlice.actions;

//selectors
export const SelectDisplay = (state) => state.search.search;

export default addProductSlice.reducer