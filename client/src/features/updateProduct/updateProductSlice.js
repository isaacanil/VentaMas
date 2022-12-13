import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    status: false,
    lastProduct: {
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
        size: '',
        type: '',
        tax: {
            unit: 0,
            total: 0
        },
        stock: 0,
        netContent: 0,
        order: 1,
        amountToBuy: {
            unit: 1,
            total: 1
        },
        id: ''
    }
}

export const updateProductSlice = createSlice({
    name: 'updateProduct',
    initialState,
    reducers: {
        ChangeProductData: (state, action) => {
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
            state.lastProduct.order = action.payload.order
            state.lastProduct.size = action.payload.size
            state.lastProduct.type = action.payload.type

            if( state.lastProduct.size === null){

            }
        },
        ChangeProductImage: (state, action) => {
            state.lastProduct.productImageURL = action.payload
        },
        clearUpdateProductData: (state) => {
            state.status = false
            state.lastProduct.productName = ''
            state.lastProduct.productImageURL = ''
            state.lastProduct.category = ''
            state.lastProduct.cost = {
                unit: 0,
                total: 0
            }
            state.lastProduct.price = {
                unit: 0,
                total: 0
            }
            state.lastProduct.size = ''
            state.lastProduct.type = ''
            state.lastProduct.tax = {
                unit: 0,
                total: 0
            }
            state.lastProduct.stock = 0
            state.lastProduct.netContent = 0
            state.lastProduct.amountToBuy = {
                unit: 1,
                total: 1
            }
            state.lastProduct.id = ''
        }
    }
})

export const { ChangeProductData, clearUpdateProductData, ChangeProductImage } = updateProductSlice.actions;

//selectors
export const selectUpdateProductData = (state) => state.updateProduct;
export default updateProductSlice.reducer