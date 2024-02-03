import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid'
import { orderAndDataCondition, orderAndDataState } from '../../constants/orderAndPurchaseState'
import * as antd from 'antd'
import { DateTime } from 'luxon'
const { notification } = antd
const EmptyPurchase = {
    id: null,
    numberId: "",
    replenishments: [],
    total: 0,
    condition: orderAndDataCondition[0].id,
    note: "",
    dates: {
        createdAt: "",
        deletedAt: "",
        completedAt: "",
        deliveryDate: DateTime.now().toMillis(),
        paymentDate: DateTime.now().toMillis(),
    },
    state: "",
    receiptUrl: "",
    provider: null,
}
const EmptyProduct = {
    product: {
        productName: "",
        cost: {
            unit: 0,
            total: 0
        },
        stock: 0,
        price: 0
    }
}
const initialState = {
    mode: "add",
    productSelected: EmptyProduct,
    previousPurchase: EmptyPurchase,
    purchase: EmptyPurchase,
    previousPurchase: EmptyPurchase,
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
            state.purchase = data ? data : null
            state.previousPurchase = data ? data : null
        },
        setProductSelected: (state, actions) => {
            const newValue = actions.payload
            state.productSelected = { ...state.productSelected, ...newValue }
        },
        SelectProduct: (state, actions) => {
            const product = actions.payload.product;
            let productData = {
                stock: product.stock,
                id: product.id,
                cost: product.cost.unit,
                productName: product.productName,
            }
            const findProduct = state.purchase.replenishments.find((item) => item.id === productData.id);
            if (findProduct) {
                productData = {
                    ...productData,
                    ...findProduct,
                }
                notification.info({
                    message: `Edición del producto: ${product.productName}`,
                    description: `Al agregar este producto, la cantidad y el costo por unidad serán actualizados con los valores ingresados. También puedes modificar estos valores directamente en los campos correspondientes de la tabla de productos.`,
                    duration: 0, // La notificación no se cerrará automáticamente
                });
            }
            state.productSelected = productData
        },
        AddProductToPurchase: (state) => {
            const findProduct = state.purchase.replenishments.find((item) => item.id === state.productSelected.id);
            if (findProduct) {
                const index = state.purchase.replenishments.indexOf(findProduct)
                state.purchase.replenishments[index] = state.productSelected
            } else {

                state.purchase.replenishments.push(state.productSelected);
            }
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