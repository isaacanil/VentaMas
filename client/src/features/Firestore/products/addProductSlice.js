import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    product: {
        productName: '',
        productImage: '',
        productImageURL: '',
        category: '',
        cost: {
            unit: "",
            total: ""
        },
        price: {
            unit: 0,
            total: 0
        },
        tax: {
            unit: 0,
            ref: '',
            value: "",
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
            state.product.productImage = action.payload.productImage
        },
        priceTotal: (state) => {
            if (
                state.product.cost.total !== "" &&
                state.product.tax.unit !== ""
            ) {
                state.product.price.total = state.product.cost.total * state.product.tax.value + state.product.cost.total
            }
        }
    }
})

export const {
    addProductData,
    priceTotal
} = addProductSlice.actions;

export const selectProduct = (state) => state.addProduct.product;

export default addProductSlice.reducer