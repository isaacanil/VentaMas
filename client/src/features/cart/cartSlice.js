import { createSlice } from "@reduxjs/toolkit";
import { initialState, defaultDelivery } from "./default/default";



const cartSlice = createSlice({
    name: 'factura',
    initialState,
    reducers: {
        toggleCart: (state) => {
            const isOpen = state.isOpen;
            state.isOpen = !isOpen;
        },
        getClient: (state, actions) => {
            const client = actions.payload;
            state.data.client = client;
            if (client?.delivery?.status === true) {
                state.data.delivery = client?.delivery
            }else{
                state.data.delivery = defaultDelivery
            }
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
            const totalPurchase = state.data.totalPurchase.value
            state.data.payment.value = totalPurchase


        },
        addProduct: (state, action) => {
            const checkingID = state.data.products.find((product) => product.id === action.payload.id)
            if (state.data.products.length > 0 && checkingID) {
                checkingID.amountToBuy.total = checkingID.amountToBuy.total + checkingID.amountToBuy.unit;
                checkingID.price.total = checkingID.price.unit * checkingID.amountToBuy.total;
                checkingID.tax.total = checkingID.tax.unit * checkingID.amountToBuy.total;
            } else {
                const product = action.payload
                const products = state.data.products
                state.data.products = [...products, product]
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
            const productFound = state.data.products.find(product => product.id === id)
            if (productFound) {
                productFound.amountToBuy.total = Number(value)
                productFound.price.total = Number(productFound.amountToBuy.total) * productFound.price.unit;
                productFound.tax.total = productFound.amountToBuy * productFound.tax.unit;
                productFound.cost.total = productFound.amountToBuy * productFound.cost.unit;
            }
        },
        addAmountToProduct: (state, action) => {
            const { value, id } = action.payload
            const productFound = state.data.products.find((product) => product.id === id)
            if (productFound) {
                productFound.amountToBuy.total = productFound.amountToBuy.total + productFound.amountToBuy.unit
                productFound.price.total = productFound.amountToBuy.total * productFound.price.unit;
                productFound.tax.total = productFound.amountToBuy.total * productFound.tax.unit + productFound.tax.unit;
                productFound.cost.total = productFound.amountToBuy.total * productFound.cost.unit + productFound.cost.unit;
            }
        },
        diminishAmountToProduct: (state, action) => {
            const { id } = action.payload
            const productFound = state.data.products.find((product) => product.id === id)
            if (productFound) {
                productFound.amountToBuy.total = productFound.amountToBuy.total - productFound.amountToBuy.unit
                productFound.price.total = productFound.amountToBuy.total * productFound.price.unit;
                if (productFound.trackInventory === true) {
                }
                if (productFound.amountToBuy.total === 0) {
                    state.data.products.splice(state.data.products.indexOf(productFound), 1)
                }
            }
        },
        CancelShipping: (state) => state = initialState,
        totalTaxes: (state) => {
            const productSelected = state.data.products
            const total = productSelected.reduce((total, product) => total + (product.price.unit * product.tax.value) * product.amountToBuy.total, 0)
            state.data.totalTaxes.value = total
        },
        totalPurchaseWithoutTaxes: (state) => {
            const ProductsSelected = state.data.products;
            const result = ProductsSelected.reduce((total, product) => total + product.cost.total, 0);
            state.data.totalPurchaseWithoutTaxes.value = result;
        },
        addDiscount: (state, action) => {
            const value = action.payload;
            state.data.discount.value = Number(value);
        },
        totalPurchase: (state) => {
            const productSelected = state.data.products
            const discountRawValue = Number(state.data.discount.value);
            const discountPercentage = (discountRawValue / 100);
            const total = Number(productSelected.reduce((total, product) => total + product.price.total, 0))
            const discount = total * discountPercentage;
            const totalWithDiscount = total - discount;
            const Delivery = state.data.delivery.status ? state.data.delivery.value : 0;
            state.data.totalPurchase.value = (Number(Delivery) + Number(totalWithDiscount))
        },
        setChange: (state) => {
            const totalPurchase = state.data.totalPurchase.value;
            const payment = state.data.payment.value;
            state.data.change.value = Number(payment) - Number(totalPurchase)
        },
        totalShoppingItems: (state) => {
            const Items = state.data.products.reduce((total, product) => total + product.amountToBuy.total, 0)
            state.data.totalShoppingItems.value = Items
        },
        addSourceOfPurchase: (state, actions) => {
            const source = actions.payload
            state.data.sourceOfPurchase = source
        },
    }
})

export const {
    addAmountToProduct,
    getClient,
    addPaymentValue,
    addPaymentMethod,
    addDiscount,
    addPaymentMethodAutoValue,
    addProduct,
    addSourceOfPurchase,
    addTaxReceiptInState,
    CancelShipping,
    deleteProduct,
    diminishAmountToProduct,
    onChangeValueAmountToProduct,
    selectClientInState,
    setChange,
    totalPurchase,
    totalPurchaseWithoutTaxes,
    totalShoppingItems,
    totalTaxes,
    updateClientInState,
    saveBillInFirebase,
    toggleCart
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
export const SelectDiscount = (state) => state.cart.data.discount.value;
export const SelectNCF = (state) => state.cart.data.NCF;
export const SelectCartPermission = () => state.cart.permission
export const SelectCartIsOpen = (state) => state.cart.isOpen

export default cartSlice.reducer







