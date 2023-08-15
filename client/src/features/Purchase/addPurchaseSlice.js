import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid'
import { orderAndDataCondition, orderAndDataState } from '../../constants/orderAndPurchaseState'

const EmptyPurchase = {
    id: null,
    products: [],
    totalPurchase: 0.00,
    condition: "",
    date: "",
    note: "",
    createdAt: "",
    updatedAt: "",
    state: "",
    imageReceiptURL: null,
    provider: {}
}
const EmptyProduct = {
    product: {
        productName: "",
        cost: {
            unit: 0,
            total: 0
        },
        stock: 0,
        price: {
            unit: 0,
            total: 0
        },
    }
}
const initialState = {
    productSelected: EmptyProduct,
    purchase: EmptyPurchase
}
export const addPurchaseSlice = createSlice({
    name: 'addPurchase',
    initialState,
    reducers: {
        getOrderData: (state, actions) => {
            const data = actions.payload
            if (state.purchase.id == null) {
                state.purchase = data
            }
            if (data.id !== null && data.id !== state.purchase.id) {
                state.purchase = data

            }
        },
        SelectProduct: (state, actions) => {
            state.productSelected = actions.payload
        },
        AddProductToPurchase: (state) => {
            state.purchase.products.push(state.productSelected)
            console.log(state.purchase.products)
            state.productSelected = EmptyProduct

            //total Precio de la compra
            const productList = state.purchase.products
            const totalPurchase = productList.reduce((total, item) => total + (item.product.initialCost * item.product.stock.newStock), 0)
            state.purchase.totalPurchase = totalPurchase
        },
        updateStock: (state, actions) => {
            const { stock } = actions.payload
            state.productSelected.product.stock = stock
        },
        AddNote: (state, actions) => {
            state.purchase.note = actions.payload
        },
        AddCondition: (state, actions) => {
            state.purchase.condition = actions.payload
        },
        AddDate: (state, actions) => {
            state.purchase.date = actions.payload
        },
        AddCreatedDate: (state) => {
            state.purchase.createdAt = Date.now()
        },
        AddIdToOrder: (state) => {
            state.purchase.id = nanoid(6)
        },
        getInitialCost: (state, actions) => {
            const { initialCost } = actions.payload
            state.productSelected.product.initialCost = initialCost
        },
        cleanPurchase: (state) => {
            state.productSelected = EmptyProduct
            state.purchase = EmptyPurchase
        },
        AddReceiptImage: (state, actions) => {
            state.purchase.imageReceiptURL = actions.payload
        },
        addProvider: (state, actions) => {
            const provider = actions.payload;
            state.purchase.provider = provider
        },
        deleteProductFromPurchase: (state, actions) => {
            const { id } = actions.payload
            const productSelected = state.purchase.products.filter((item) => item.product.id === id)
            const index = state.purchase.products.indexOf(productSelected)
            state.purchase.products.splice(index, 1)
            //total Precio del pedido
            const productList = state.purchase.products
            const totalPurchase = productList.reduce((total, item) => total + (item.product.price.unit * item.product.stock.newStock), 0)
            state.purchase.totalPurchase = totalPurchase

        },
    }
})

export const { addNote, deleteProductFromPurchase, SelectProduct, updateStock, getInitialCost, AddProductToPurchase, cleanPurchase, addProvider, getOrderData, getPendingPurchaseFromDB, handleSetFilterOptions, AddCondition } = addPurchaseSlice.actions;

//selectors
export const SelectProductSelected = (state) => state.addPurchase.productSelected;
export const selectAddPurchaseList = (state) => state.addPurchase.pendingOrders;
export const selectProducts = (state) => state.addPurchase.products;
export const selectPurchase = (state) => state.addPurchase.purchase;

export default addPurchaseSlice.reducer