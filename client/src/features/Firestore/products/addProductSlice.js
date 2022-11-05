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
            console.log(action.payload)
            // state.product.productName = action.payload.productName
            state.product.productImage = action.payload.productImage
            // state.product.productImageURL = action.payload.productImageURL
            // state.product.cost = action.payload.cost
            // state.product.price = action.payload.price
            // state.product.stock = action.payload.stock
            // state.product.tax = action.payload.tax
            // state.product.category = action.payload.category
            // state.product.netContent = action.payload.netContent
            // state.product.amountToBuy = action.payload.amountToBuy
            // state.product.id = action.payload.id

           
        
        },
        priceTotal: (state, action) => {
           
            if(
                state.product.cost.total !== "" &&
                state.product.tax.unit !== ""
            ){
                state.product.price.total = state.product.cost.total * state.product.tax.value + state.product.cost.total
            }
        }
        
    }
})

export const {
    addProductData,
    priceTotal
} = addProductSlice.actions;

//selectors
export const selectProduct = (state) => state.addProduct.product;

export default addProductSlice.reducer