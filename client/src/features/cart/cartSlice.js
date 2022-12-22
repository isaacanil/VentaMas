import { createSlice } from "@reduxjs/toolkit";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { separator } from "../../hooks/separator";
import { Product } from "../../views";
import { v4 } from "uuid";
import { nanoid } from "nanoid";
import { IoFemaleSharp } from "react-icons/io5";
import { updateClient } from "../../firebase/firebaseconfig";

const defaultValue = {
    id: '',
    client: {
        name: '',
        tel: '',
        address: '',
        personalID: ''
    },
    products: [],
    change: {
        value: 0
    },
    delivery: {
        status: false,
        value: 0
    },
    paymentMethod: [
        {
            method: 'cash',
            value: 0,
            status: true
        },
        {
            method: 'card',
            value: 0,
            status: false
        },
        {
            method: 'transfer',
            value: 0,
            status: false
        }
    ],
    totalShoppingItems: {
        value: 0
    },
    totalPurchaseWithoutTaxes: {
        value: 0
    },
    totalTaxes: {
        value: 0
    },
    totalPurchase: {
        value: 0
    },
    change: {
        value: 0
    }
}
var client = null;
const initialState = {
    id: null,
    client: defaultValue.client,
    products: [],
    delivery: {
        status: false,
        value: Number(0)
    },
    paymentMethod: [
        {
            method: 'cash',
            value: 0,
            status: true
        },
        {
            method: 'card',
            value: 0,
            status: false
        },
        {
            method: 'transfer',
            value: 0,
            status: false
        },
    ],
    totalShoppingItems: {
        value: 0
    },
    totalPurchaseWithoutTaxes: {
        value: 0
    },
    totalTaxes: {
        value: 0
    },
    totalPurchase: {
        value: 0
    },
    change: {
        value: 0
    },
    source: ""

}
const cartSlice = createSlice({
    name: 'factura',
    initialState,
    reducers: {
        addClient: (state, action) => {
    
            const clientData = action.payload
            state.client = {...clientData}
            console.log('actualizado', state.client, 'original', client)
            if (client === null || client.id !== clientData.id) {
                client = clientData
                console.log('actualizado', state.client, 'original', client)
                return
            } 
         
           

        },
        handleUpdateClient: (state) => {
            const obj1 = client;
            const obj2 = state.client
            const isDifferent = Object.values(obj1).sort().toString() === Object.values(obj2).sort().toString()
            if(isDifferent === false){
                updateClient(obj2)
            }else{
                return
            }
        },
        deleteClient: (state) => {
            state.client = defaultValue.client
            client = null
        },
        addDelivery: (state, action) => {
            const { cash, status } = action.payload
            state.delivery.value = cash
            state.delivery.status = status
        },
        addCashPaymentMethod: (state, action) => {
            state.paymentMethod = action.payload
            if (action.payload.status == false) {
                state.change.value = undefined
            }
        },
        addCardPaymentMethod: (state, action) => {
            state.paymentMethod = action.payload
            if (action.payload.status == false) {
                state.change.value = undefined
            }
        },
        addTransferPaymentMethod: (state, actions) => {
            state.paymentMethod = actions.payload
            if (actions.payload.status == false) {
                state.change.value = undefined
            }
        },
        addPaymentMethod: (state, actions) => {
            const data = actions.payload
            state.paymentMethod = data
        },
        handleChangePaymentMethod: (state) => {
        //     const methodActived = state.paymentMethod.find((method) => method.status === true)
        //    if(methodActived){
        //         methodActived.value = state.totalPurchase.value
        //    }
           const obtenerMetodoPagoActivo = (paymentMethod) => {
            return paymentMethod.find((method) => method.status === true);
          }
          
          () => {
            const methodActived = obtenerMetodoPagoActivo(state.paymentMethod);
            if (methodActived) {
              methodActived.value = state.totalPurchase.value;
            }
          }
        },
        addProduct: (state, action) => {
            if (state.id === null || state.id === undefined || state.id === '') {
                state.id = nanoid(8)
            }
            const checkingID = state.products.find((product) => product.id === action.payload.id)
            if (state.products.length > 0 && checkingID) {
                checkingID.amountToBuy.total = checkingID.amountToBuy.total + checkingID.amountToBuy.unit;
                checkingID.price.total = checkingID.price.unit * checkingID.amountToBuy.total;
                checkingID.stock = checkingID.stock - checkingID.amountToBuy.unit;
                checkingID.tax.total = checkingID.tax.unit * checkingID.amountToBuy.total;
            } else {
                const product = action.payload
                const products = state.products
                const newProduct = Object.assign({}, product, { stock: product.stock - product.amountToBuy.unit })
                state.products = [...products, newProduct]
            }
        },
        deleteProduct: (state, action) => {
            const productFound = state.products.find((product) => product.id === action.payload)
            if (productFound) {
                state.products.splice(state.products.indexOf(productFound), 1)
            }
            if (state.products.length === 0) {
                state.id = null
                state.products = []
            }
        },
        onChangeValueAmountToProduct: (state, action) => {
            const { id, value } = action.payload
            const productFound = state.products.find(product => product.id === id)
            if (productFound) {
                productFound.amountToBuy.total = Number(value)
                //console.log(Number(value))
                productFound.price.total = Number(productFound.amountToBuy.total) * productFound.price.unit;
                productFound.tax.total = productFound.amountToBuy * productFound.tax.unit;
                productFound.cost.total = productFound.amountToBuy * productFound.cost.unit;
                productFound.stock = productFound.stock + productFound.amountToBuy.unit
            }
        },
        addAmountToProduct: (state, action) => {
            const { value, id } = action.payload
            const productFound = state.products.find((product) => product.id === id)
            if (productFound) {
                productFound.amountToBuy.total = productFound.amountToBuy.total + productFound.amountToBuy.unit
                productFound.stock = productFound.stock - productFound.amountToBuy.unit;
                productFound.price.total = productFound.amountToBuy.total * productFound.price.unit;
                productFound.tax.total = productFound.amountToBuy.total * productFound.tax.unit + productFound.tax.unit;
                productFound.cost.total = productFound.amountToBuy.total * productFound.cost.unit + productFound.cost.unit;
            }
        },
        diminishAmountToProduct: (state, action) => {
            const { id } = action.payload
            const productFound = state.products.find((product) => product.id === id)
            const originalStock = productFound.stock
            if (productFound) {
                productFound.amountToBuy.total = productFound.amountToBuy.total - productFound.amountToBuy.unit
                productFound.price.total = productFound.amountToBuy.total * productFound.price.unit;
                productFound.stock = productFound.stock + productFound.amountToBuy.unit
                if (productFound.amountToBuy.total === 0) {
                    state.products.splice(state.products.indexOf(productFound), 1)
                }
            }
        },
        CancelShipping: state => state = defaultValue,
        totalTaxes: (state) => {
            const productSelected = state.products
            const total = productSelected.reduce((total, product) => total + product.tax.total, 0)
            state.totalTaxes.value = total
        },
        totalPurchaseWithoutTaxes: (state) => {
            const ProductsSelected = state.products;
            const result = ProductsSelected.reduce((total, product) => total + product.cost.total, 0);
            state.totalPurchaseWithoutTaxes.value = result;
        },
        totalPurchase: (state) => {
            const productSelected = state.products
            const total = productSelected.reduce((total, product) => total + product.price.total, 0)
            const Delivery = state.delivery.value;
            state.totalPurchase.value = (Number(Delivery) + Number(total))

        },
        setChange: (state) => {
            const totalPurchase = state.totalPurchase.value;
            const isTrue = state.paymentMethod.find((method) => method.status === true)
            if (isTrue) {
                state.change.value = ((Number(totalPurchase) * -1) + Number(isTrue.value))
            }
        },
        totalShoppingItems: (state) => {
            const Items = state.products.reduce((total, product) => total + product.amountToBuy.total, 0)
            state.totalShoppingItems.value = Items
        }
    }
})

export const {
    addClient,
    handleUpdateClient,
    deleteClient,
    addProduct,
    addDelivery,
    addCashPaymentMethod,
    addCardPaymentMethod,
    addTransferPaymentMethod,
    handleChangePaymentMethod,
    deleteProduct,
    onChangeValueAmountToProduct,
    addAmountToProduct,
    diminishAmountToProduct,
    CancelShipping,
    totalPurchaseWithoutTaxes,
    totalTaxes,
    totalShoppingItems,
    totalPurchase,
    setChange,
    addPaymentMethod,
} = cartSlice.actions

export const SelectProduct = (state) => state.cart.products;
export const SelectFacturaData = (state) => state.cart;
export const SelectClient = (state) => state.cart.client;
export const SelectDelivery = (state) => state.cart.delivery;
export const SelectTotalPurchaseWithoutTaxes = (state) => state.cart.totalPurchaseWithoutTaxes.value;
export const SelectTotalTaxes = (state) => state.cart.totalTaxes.value;
export const SelectTotalPurchase = (state) => state.cart.totalPurchase.value;
export const SelectTotalShoppingItems = (state) => state.cart.totalShoppingItems.value;
export const SelectChange = (state) => state.cart.change.value;

export default cartSlice.reducer







