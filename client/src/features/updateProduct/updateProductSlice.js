import { createSlice } from '@reduxjs/toolkit'
import { initTaxes } from '../../views/component/modals/UpdateProduct/InitializeData'

const emptyProduct = {
    status: 'create',
    product: {
        productName: '',
        productImageURL: '',
        category: '',
        cost: { unit: 0, total: 0 },
        price: { unit: 0, total: 0 },
        size: '',
        type: '',
        isVisible: true,
        tax: initTaxes[0].tax,
        stock: 0,
        netContent: 0,
        order: 1,
        amountToBuy: { unit: 1, total: 1 },
        id: '',
        trackInventory: false,
        qrCode: '',
        barCode: '',
    }
}

const initialState = {
    status: false,
    product: {
        productName: '',
        productImageURL: '',
        category: '',
        cost: { unit: 0, total: 0 },
        price: { unit: 0, total: 0 },
        size: '',
        type: '',
        tax: initTaxes[0].tax,
        stock: 0,
        netContent: 0,
        qrCode: '',
        barCode: '',
        order: 1,
        amountToBuy: { unit: 1, total: 1 },
        id: '',
        trackInventory: false,
    }
}

export const updateProductSlice = createSlice({
    name: 'updateProduct',
    initialState,
    reducers: {
        ChangeProductData: (state, action) => {
           const {status, product} = action.payload
            state.status = status
            state.product = {
                ...state.product,
                ...product,
            };
        },
        setProduct: (state, action) => {
            const product = action.payload
            state.product = product
        },
        ChangeProductImage: (state, action) => {
            state.product.productImageURL = action.payload
        },
        clearUpdateProductData: (state) => {
            state.product = emptyProduct.product
            state.status = emptyProduct.status
        }
    }
})

export const { ChangeProductData, clearUpdateProductData, ChangeProductImage, setProduct } = updateProductSlice.actions;

//selectors
export const selectUpdateProductData = (state) => state.updateProduct;
export default updateProductSlice.reducer