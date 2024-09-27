import { createSlice } from '@reduxjs/toolkit'
import { initTaxes } from '../../views/component/modals/UpdateProduct/InitializeData'
import { warrantyOptions } from '../../views/component/modals/ProductForm/components/sections/WarrantyInfo'

const defaultProduct = {
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
        weightDetail: {
            isSoldByWeight: false,
            weightUnit: 'lb',
            weight: 0,
        },
        warranty: {
            status: false,
            unit: warrantyOptions[1].value,
            quantity: 1,
        },
        size: '',
        type: '',
        stock: 0,
        netContent: '',
        amountToBuy: 1,
        createdBy: 'unknown',
        id: '',
        order: 1,
        isVisible: true,
        footer: '',
        measurement: '',
        trackInventory: true,
        qrcode: '',
        barcode: '',
    }
}

const initialState = { ...defaultProduct }

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
            state.product = {
                ...state.product,
                ...product,
            }
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
            state.product = defaultProduct.product
            state.status = defaultProduct.status
        }
    }
})

export const { ChangeProductData, changeProductPrice, clearUpdateProductData, ChangeProductImage, setProduct } = updateProductSlice.actions;

//selectors
export const selectUpdateProductData = (state) => state.updateProduct;
export default updateProductSlice.reducer