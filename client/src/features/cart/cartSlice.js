import { createSlice } from "@reduxjs/toolkit";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { separator } from "../../hooks/separator";
import { Product } from "../../views";
import { v4 } from "uuid";
import { nanoid } from "nanoid";
import { IoFemaleSharp } from "react-icons/io5";
import { createClient, updateClient } from "../../firebase/firebaseconfig";
import { useCompareObjectsInState } from "../../hooks/useCompareObject";
const defaultValue = {
    data: {
        id: '',
        client: {
            name: '',
            tel: '',
            address: '',
            personalID: '',
            delivery: {
                status: false,
                value: ''
            }
        },
        products: [],
        change: {//cambio
            value: 0
        },
        delivery: {
            status: false,
            value: 0
        },
        discount: {
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
        NCF: '',
        totalShoppingItems: {
            value: 0
        },
        totalPurchaseWithoutTaxes: {
            value: 0
        },
        totalTaxes: {
            value: 0
        },
        payment: {//pago realizado por el cliente
            value: 0
        },
        totalPurchase: {
            value: ''
        },
        sourceOfPurchase: 'Presencial'
    },
    handleClient: {
        mode: 'search',
        modeLabel: 'search',
        UPDATED_CLIENT: null,
    }
}
export let ORIGINAL_CLIENT = null;
const initialState = defaultValue
const cartSlice = createSlice({
    name: 'factura',
    initialState,
    reducers: {
        setClientModeInState: (state, actions) => {
            state.handleClient.mode = actions.payload
            state.handleClient.modeLabel = actions.payload
        },
        isNewClient: (state) => {
            if (state.data.client.name === '') {
                console.log('no cliente')
                state.data.client = {
                    name: 'Cliente Genérico',
                    tel: '',
                    address: '',
                    personalID: ''
                }
                return
            }
            if (state.handleClient.UPDATED_CLIENT !== null && state.handleClient.UPDATED_CLIENT.id === state.data.client.id && !useCompareObjectsInState(state.data.client, state.handleClient.UPDATED_CLIENT)) {
                console.log(state.handleClient.UPDATED_CLIENT)
                updateClient(state.handleClient.UPDATED_CLIENT)
                state.client = state.handleClient.UPDATED_CLIENT
                return
            }
            if (!("id" in state.data.client) && state.data.client.name.length > 0 && state.data.client.name !== 'Cliente Genérico') {
                const id = nanoid(8)
                const client = state.data.client;
                state.data.client = { ...client, id }
                createClient(state.data.client)
                return
            }

            return

        },
        updateClientInState: (state, action) => {
            const updatedClient = action.payload
            const clientSelected = state.data.client
            if (updatedClient.id === clientSelected.id) {
                state.handleClient.UPDATED_CLIENT = updatedClient
                console.log(state.handleClient.UPDATED_CLIENT, 'update función')
            }
        },
        createClientInState: (state, action) => {
            state.handleClient.UPDATED_CLIENT = null
            state.data.client = action.payload
        },
        selectClientInState: (state, action) => {
            state.data.client = action.payload
            console.log(state.handleClient.UPDATED_CLIENT, state.data.client, 'client')
            
        },
        deleteClientInState: (state) => {
            state.data.client = {
                name: '',
                tel: '',
                address: '',
                personalID: '',
                delivery: ''
            }
            state.data.delivery = {
                status: false,
                value: ''
            }
            state.handleClient.UPDATED_CLIENT = null
        },
        addPaymentValue: (state, actions) => {
            const paymentValue = actions.payload
            const paymentMethod = state.data.paymentMethod.find((item) => item.status === true)
            if (paymentMethod) {
                state.data.payment.value = Number(paymentValue)
                paymentMethod.value = state.data.payment.value
            }
        },
        addTaxReceiptInState: (state, actions) => {
            state.data.NCF = actions.payload
        },
        addDelivery: (state, action) => {
            const { cash, status } = action.payload
            state.data.delivery.value = cash
            state.data.delivery.status = status
            if (state.data.delivery.status === false) {
                state.data.delivery.value = 0
            }
        },
        addPaymentMethod: (state, actions) => {
            const data = actions.payload
            state.data.paymentMethod = data
        },
        changePaymentMethod: (state, actions) => {
            const paymentMethod = state.data.paymentMethod
            const paymentMethodSelected = paymentMethod.findIndex((method) => method.status === true)
            if (paymentMethodSelected) {
                paymentMethodSelected
            }
        },
        addPaymentMethodAutoValue: (state) => {
            const activatedMethod = state.data.paymentMethod.find((method) => method.status === true)
            if (activatedMethod) {
                activatedMethod.value = state.data.totalPurchase.value
            }
        },
        addProduct: (state, action) => {
            if (state.data.id === null || state.data.id === undefined || state.data.id === '') {
                state.data.id = nanoid(8)
            }
            const checkingID = state.data.products.find((product) => product.id === action.payload.id)
            if (state.data.products.length > 0 && checkingID) {
                checkingID.amountToBuy.total = checkingID.amountToBuy.total + checkingID.amountToBuy.unit;
                checkingID.price.total = checkingID.price.unit * checkingID.amountToBuy.total;
                checkingID.stock = checkingID.stock - checkingID.amountToBuy.unit;
                checkingID.tax.total = checkingID.tax.unit * checkingID.amountToBuy.total;
            } else {
                const product = action.payload
                const products = state.data.products
                const newProduct = Object.assign({}, product, { stock: product.stock - product.amountToBuy.unit })
                state.data.products = [...products, newProduct]
            }
        },
        deleteProduct: (state, action) => {
            const productFound = state.data.products.find((product) => product.id === action.payload)
            if (productFound) {
                state.data.products.splice(state.data.products.indexOf(productFound), 1)
            }
            if (state.data.products.length === 0) {
                state.data.id = null
                state.data.products = []
            }
        },
        onChangeValueAmountToProduct: (state, action) => {
            const { id, value } = action.payload
            const productFound = state.data.data.products.find(product => product.id === id)
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
            const productFound = state.data.products.find((product) => product.id === id)
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
            const productFound = state.data.products.find((product) => product.id === id)
            const originalStock = productFound.stock
            if (productFound) {
                productFound.amountToBuy.total = productFound.amountToBuy.total - productFound.amountToBuy.unit
                productFound.price.total = productFound.amountToBuy.total * productFound.price.unit;
                productFound.stock = productFound.stock + productFound.amountToBuy.unit
                if (productFound.amountToBuy.total === 0) {
                    state.data.products.splice(state.data.products.indexOf(productFound), 1)
                }
            }
        },
        CancelShipping: state => state = defaultValue,
        totalTaxes: (state) => {
            const productSelected = state.data.products
            const total = productSelected.reduce((total, product) => total + product.tax.total, 0)
            state.data.totalTaxes.value = total
        },
        totalPurchaseWithoutTaxes: (state) => {
            const ProductsSelected = state.data.products;
            const result = ProductsSelected.reduce((total, product) => total + product.cost.total, 0);
            state.data.totalPurchaseWithoutTaxes.value = result;
        },
        addDiscount: (state, action) => {
            const value = action.payload
            state.data.discount.value = Number(value)
        },
        totalPurchase: (state) => {
            const productSelected = state.data.products
            const discountRawValue = Number(state.data.discount.value);
            const discountPercentage = (discountRawValue / 100);
            const total = Number(productSelected.reduce((total, product) => total + product.price.total, 0))
            const discount = total * discountPercentage;
            const totalWithDiscount = total - discount;
            const Delivery = state.data.delivery.value;
            state.data.totalPurchase.value = (Number(Delivery) + Number(totalWithDiscount))
  
        },
        setChange: (state) => {
            const totalPurchase = state.data.totalPurchase.value;
            const isTrue = state.data.paymentMethod.find((method) => method.status === true)
            if (isTrue && isTrue.value !== false) {
                state.data.change.value = ((Number(totalPurchase) * -1) + Number(isTrue.value))
            }
        },
        totalShoppingItems: (state) => {
            const Items = state.data.products.reduce((total, product) => total + product.amountToBuy.total, 0)
            state.data.totalShoppingItems.value = Items
        },
        addSourceOfPurchase: (state, actions) => {
            const source = actions.payload
            state.data.sourceOfPurchase = source
        }
    }
})

export const {
    addAmountToProduct,
    setClientModeInState,
    addClientInState,
    addDelivery,
    addPaymentValue,
    addPaymentMethod,
    addDiscount,
    addPaymentMethodAutoValue,
    addProduct,
    addSourceOfPurchase,
    addTaxReceiptInState,
    CancelShipping,
    createClientInState,
    deleteClientInState,
    deleteProduct,
    diminishAmountToProduct,
    handleClient,
    isNewClient,
    onChangeValueAmountToProduct,
    selectClientInState,
    setChange,
    totalPurchase,
    totalPurchaseWithoutTaxes,
    totalShoppingItems,
    totalTaxes,
    updateClientInState
} = cartSlice.actions

export const SelectProduct = (state) => state.cart.data.products;
export const SelectFacturaData = (state) => state.cart.data;
export const SelectClient = (state) => state.cart.data.client;
export const SelectDelivery = (state) => state.cart.data.delivery;
export const SelectTotalPurchaseWithoutTaxes = (state) => state.cart.data.totalPurchaseWithoutTaxes.value;
export const SelectTotalTaxes = (state) => state.cart.data.totalTaxes.value;
export const SelectTotalPurchase = (state) => state.cart.data.totalPurchase.value;
export const SelectTotalShoppingItems = (state) => state.cart.data.totalShoppingItems.value;
export const SelectChange = (state) => state.cart.data.change.value;
export const SelectSourceOfPurchase = (state) => state.cart.data.sourceOfPurchase;
export const SelectPaymentValue = (state) => state.cart.data.payment.value;
export const SelectClientMode = (state) => state.cart.handleClient.mode;
export const SelectDiscount = (state) => state.cart.data.discount.value;

export default cartSlice.reducer







