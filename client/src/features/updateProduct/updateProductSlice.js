import { createSlice } from '@reduxjs/toolkit'
import { initTaxes } from '../../views/component/modals/UpdateProduct/InitializeData'

const emptyProduct = {
    status: false,
    product: {
        productName: '',
        productImageURL: '',
        category: '',
        pricing: {
            cost: 0,
            price: 0,
            listPrice: 0,
            avgPrice: 0,
            minPrice: 0,
            tax: initTaxes[0],
        },
        size: '',
        type: '',
        stock: 0,
        netContent: '',
        amountToBuy: 1,
        createdBy: 'unknown',
        id: '',
        isVisible: true,
        trackInventory: true,
        qrCode: '',
        barCode: '',
    }
}

const initialState = {
    status: false,
    product: {
        name: '',
        image: '',
        category: '',
        pricing: {
            cost: 0,
            price: 0,
            listPrice: 0,
            avgPrice: 0,
            minPrice: 0,
            tax: initTaxes[0],
        },
        promotions: {
            start: null,
            end: null,
            discount: 0,
            isActive: false,
        },
        size: '',
        type: '',
        stock: 0,
        netContent: '',
        qrCode: '',
        barCode: '',
        order: 1,
        amountToBuy: { unit: 1, total: 1 },
        id: '',
        trackInventory: true,
    }
}

export const updateProductSlice = createSlice({
    name: 'updateProduct',
    initialState,
    reducers: {
        ChangeProductData: (state, action) => {
            const { status, product } = action.payload
            if (!state.status) {
                state.status = status
            }
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
            state.product.image = action.payload
        },
        changeProductPrice: (state, action) => {
            
           
            state.product.pricing = {
                ...state.product.pricing,
                ...action?.payload?.pricing
            }
            if (action?.payload?.pricing?.listPrice) {
                state.product.pricing.price = action?.payload?.pricing?.listPrice
            }
        },
        clearUpdateProductData: (state) => {
            state.product = emptyProduct.product
            state.status = emptyProduct.status
        }
    }
})

export const { ChangeProductData, changeProductPrice, clearUpdateProductData, ChangeProductImage, setProduct } = updateProductSlice.actions;

//selectors
export const selectUpdateProductData = (state) => state.updateProduct;
export default updateProductSlice.reducer