import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid'
import { orderAndDataCondition, orderAndDataState } from '../../constants/orderAndPurchaseState'

const EmptyPurchase = {
    id: null,
    numberId: "",
    replenishments: [],
    total: 0,
    condition: "",
    note: "",
    dates: {
        createdAt: "",
        deletedAt: "",
        completedAt: "",
        deliveryDate: "",
        paymentDate: "",
    },
    state: "",
    receiptUrl: "",
    provider: {},
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
    mode: "add",
    productSelected: EmptyProduct,
    purchase: EmptyPurchase
}
export const addPurchaseSlice = createSlice({
    name: 'addPurchase',
    initialState,
    reducers: {
        setAddPurchaseMode: (state, actions) => {
      
            state.mode = actions.payload
        },
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
            state.purchase.total = totalPurchase;
        },
        updateStock: (state, actions) => {
            const { stock } = actions.payload
            state.productSelected.product.stock = stock
        },
        setPurchase: (state, actions) => {
            state.purchase = { ...state.purchase, ...actions.payload }
        },
        getInitialCost: (state, actions) => {
            const { initialCost } = actions.payload
            state.productSelected.product.initialCost = initialCost
        },
        cleanPurchase: (state) => {
            state.productSelected = EmptyProduct
            state.purchase = EmptyPurchase
            state.mode = "add"
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
            state.purchase.receiptUrl = actions.payload
        },
        deleteReceiptImageFromPurchase: (state) => {
            state.purchase.receiptUrl = "";
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

export const {
    updateStock,
    setPurchase,
    getOrderData,
    updateProduct,
    cleanPurchase,
    SelectProduct,
    setAddPurchaseMode,
    getInitialCost,
    setProductSelected,
    AddProductToPurchase,
    getPendingPurchaseFromDB,
    addReceiptImageToPurchase,
    deleteProductFromPurchase,
    deleteReceiptImageFromPurchase,
    handleSetFilterOptions
} = addPurchaseSlice.actions;

//selectors
export const SelectProductSelected = (state) => state.addPurchase.productSelected;
export const selectAddPurchaseList = (state) => state.addPurchase.pendingOrders;
export const selectProducts = (state) => state.addPurchase.products;
export const selectPurchase = (state) => state.addPurchase.purchase;
export const selectPurchaseState = (state) => state.addPurchase;

export default addPurchaseSlice.reducer