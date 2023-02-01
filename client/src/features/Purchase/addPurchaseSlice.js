import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid'

const EmptyPurchase = {
    id: "",
    products: [],
    totalPurchase: 0.00,
    condition: "",
    date: "",
    note: "",
    createdAt: "",
    updatedAt: "",
    state: {
        name: 'solicitado',
        color: 'yellow'
    },
    provider: {
        providerId: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        createdAt: "",
        updatedAt: "",

    }
}
const EmptyProduct = {
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
const initialState = {
    productSelected: { product: EmptyProduct },
    purchase: EmptyPurchase
}
export const addPurchaseSlice = createSlice({
    name: 'addPurchase',
    initialState,
    reducers: {
        getOrderData: (state, actions) => {
            const data = actions.payload
            state.purchase = data
        },
        SelectProduct: (state, actions) => {
            state.productSelected = actions.payload
            console.log(state.productSelected)
            //const purchase = state.order.products.reduce((item)=>)
        },
        AddProduct: (state) => {
            state.order.products.push(state.productSelected)
            console.log(state.order.products)
            state.productSelected = {
                product: {
                    productName: undefined,
                    cost: {
                        unit: 0
                    },
                    stock: 0,
                    price: {
                        unit: 0
                    },
                }
            }

            //total Precio del pedido
            const productList = state.order.products
            const totalPurchase = productList.reduce((total, item) => total + (item.product.price.unit * item.product.stock), 0)
            state.order.totalPurchase = totalPurchase
        },
        updateStock: (state, actions) => {
            const { newStock } = actions.payload
            state.productSelected.product.stock = newStock
        },
        AddNote: (state, actions) => {
            state.order.note = actions.payload
        },
        AddCondition: (state, actions) => {
            state.order.condition = actions.payload
        },
        AddDate: (state, actions) => {
            state.order.date = actions.payload
        },
        AddCreatedDate: (state) => {
            state.order.createdAt = Date.now()
        },
        AddIdToOrder: (state) => {
            state.order.id = nanoid(6)
        },
        cleanPurchase: (state) => {
            state.productSelected = { product: EmptyProduct }
            state.purchase = EmptyPurchase
        },
        AddProvider: (state, actions) => {
            state.purchase.provider = actions.payload
        }

    }
})

export const { AddProvider, getOrderData, getPendingPurchaseFromDB, handleSetFilterOptions } = addPurchaseSlice.actions;

//selectors

export const selectAddPurchaseList = (state) => state.addPurchase.pendingOrders;
export const selectPurchase = (state) => state.addPurchase.purchase

export default addPurchaseSlice.reducer