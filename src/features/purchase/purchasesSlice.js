import { createSlice } from '@reduxjs/toolkit'


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