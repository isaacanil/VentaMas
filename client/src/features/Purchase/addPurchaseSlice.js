import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid'
import { orderAndDataCondition, orderAndDataState } from '../../constants/orderAndPurchaseState'

const EmptyPurchase = {
    id: null,
    replenishments: [],
    total: 0,
    condition: "",
    note: "",
    dates: {
        createdAt: "",
        deletedAt: "",
        completedAt: "",
        deliveryDate: "",
    },
    state: "",
    receiptImgUrl: "",
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
            data ? state.purchase = data : null

        },
        setProductSelected: (state, actions) => {
            const newValue = actions.payload
            state.productSelected = { ...state.productSelected, ...newValue }
        },
        SelectProduct: (state, actions) => {
            const product = actions.payload.product;
            state.productSelected.stock = product.stock;
            state.productSelected.newStock = '';
            state.productSelected.initialCost = '';
            state.productSelected.id = product.id;
            state.productSelected.cost = product.cost.unit;
            state.productSelected.productName = product.productName;
        },
        AddProductToPurchase: (state) => {
            state.purchase.replenishments.push(state.productSelected);
            state.productSelected = EmptyProduct;
            //total Precio de la compra
            const productList = state.purchase.replenishments;
            const totalPurchase = productList.reduce((total, item) => total + (item.initialCost * item.newStock), 0)
            state.purchase.total = totalPurchase
        },
        updateStock: (state, actions) => {
            const { stock } = actions.payload
            state.productSelected.product.stock = stock
        },
        setNote: (state, actions) => {
            state.purchase.note = actions.payload
        },
        AddCondition: (state, actions) => {
            state.purchase.condition = actions.payload
        },
        setDate: (state, actions) => {
            state.purchase.dates.deliveryDate = actions.payload
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
        updateProduct: (state, actions) => {
            const { value, productID } = actions.payload;
            const index = state.purchase.replenishments.findIndex((item) => item.id === productID);
            if (index !== -1) {
                state.purchase.replenishments[index] = {
                    ...state.purchase.replenishments[index],
                    ...value,
                };
                state.purchase.total = state.purchase.replenishments.reduce((total, item) => total + (item.initialCost * item.newStock), 0);
            }

        },
        addReceiptImageToPurchase: (state, actions) => {
            state.purchase.receiptImgUrl = actions.payload
        },
        deleteReceiptImageFromPurchase: (state) => {
            state.purchase.receiptImgUrl = "";
        },
        addProvider: (state, actions) => {
            const provider = actions.payload;
            state.purchase.provider = provider
        },

        deleteProductFromPurchase: (state, actions) => {
            const { id } = actions.payload
            const productSelected = state.purchase.replenishments.filter((item) => item.id === id)
            const index = state.purchase.replenishments.indexOf(productSelected)
            state.purchase.replenishments.splice(index, 1)
            //total Precio del pedido
            const productList = state.purchase.replenishments
            const totalPurchase = productList.reduce((total, item) => total + (item.initialCost * item.newStock), 0)
            state.purchase.total = totalPurchase

        },
    }
})

export const { setNote, setDate, updateProduct, deleteReceiptImageFromPurchase, addReceiptImageToPurchase, setProductSelected, deleteProductFromPurchase, SelectProduct, updateStock, getInitialCost, AddProductToPurchase, cleanPurchase, addProvider, getOrderData, getPendingPurchaseFromDB, handleSetFilterOptions, AddCondition } = addPurchaseSlice.actions;

//selectors
export const SelectProductSelected = (state) => state.addPurchase.productSelected;
export const selectAddPurchaseList = (state) => state.addPurchase.pendingOrders;
export const selectProducts = (state) => state.addPurchase.products;
export const selectPurchase = (state) => state.addPurchase.purchase;

export default addPurchaseSlice.reducer