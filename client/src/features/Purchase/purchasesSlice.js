import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid'


const initialState = {
    purchases: [

    ],
}

export const purchasesSlice = createSlice({
    name: 'purchases',
    initialState,
    reducers: {
        updatePurchases: (state, actions) => {
            const data = actions.payload
            state.purchases = data
        },
    }
})

export const { updatePurchases } = purchasesSlice.actions;

export const selectPurchaseList = (state) => state.purchases.purchases;

export default purchasesSlice.reducer;