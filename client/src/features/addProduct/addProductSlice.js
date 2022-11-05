import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    
    product: {
        productName: '',
        productImageURL: '',
        category: '',
        cost: {
            unit: 0,
            total: 0
        },
        price: {
            unit: 0,
            total: 0
        },
        tax: {
            unit: 0,
            total: 0
        },
        stock: 0,
        netContent: 0,
        amountToBuy: {
            unit: 1,
            total: 1
        },
        id: ''
    }
}

export const addProductSlice = createSlice({
    name: 'addProduct',
    initialState,
    reducers: {
        addProductData: (state, action) => {
            console.log(action.payload)
            state.status = true
            state.lastProduct.productName = action.payload.productName
            state.lastProduct.productImageURL = action.payload.productImageURL
            state.lastProduct.cost = action.payload.cost
            state.lastProduct.price = action.payload.price
            state.lastProduct.stock = action.payload.stock
            state.lastProduct.tax = action.payload.tax
            state.lastProduct.category = action.payload.category
            state.lastProduct.netContent = action.payload.netContent
            state.lastProduct.amountToBuy = action.payload.amountToBuy
            state.lastProduct.id = action.payload.id
        }
    }
})

export const { ChangeProductData } = addProductSlice.actions;

//selectors
export const selectUpdateProductData = (state) => state.updateProduct;
export default addProductSlice.reducer