import { createSlice } from "@reduxjs/toolkit";
import { initialState, defaultDelivery } from "./default/default";
import { GenericClient } from "../clientCart/clientCartSlice";
import { getProductsPrice, getProductsTax, getProductsTotalPrice, getTax, getTotalItems } from "../../utils/pricing";
import { update } from "lodash";
import { nanoid } from "nanoid";

const limitTwoDecimal = (number) => {
    return Number(number.toFixed(2))
}



const calculateChange = (payment, totalPurchase) => (payment - totalPurchase);

// Función agrupadora para actualizar todos los totales
const updateAllTotals = (state, paymentValue = null) => {
    const products = state.data.products;
    const discount = state?.data?.discount?.value;
    const delivery = state?.data?.delivery?.value;
    state.data.totalPurchase.value = getProductsTotalPrice(products, discount, delivery);
    state.data.totalTaxes.value = getProductsTax(products);
    state.data.totalShoppingItems.value = getTotalItems(products);
    state.data.totalPurchaseWithoutTaxes.value = getProductsPrice(products);
    state.data.payment.value = paymentValue !== null ? paymentValue : state.data.totalPurchase.value;
    state.data.change.value = calculateChange(state.data.payment.value, state.data.totalPurchase.value);
};

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
            if (client?.id) {
                state.data.client = client;
            }
            if (client?.delivery?.status === true) {
                state.data.delivery = client?.delivery
            } else {
                state.data.delivery = defaultDelivery
            }
            updateAllTotals(state)
        },
        setDefaultClient: (state) => {
            state.data.client = GenericClient
        },
        addPaymentValue: (state, actions) => {
            const paymentValue = actions.payload
            const paymentMethod = state.data.paymentMethod.find((item) => item.status === true)
            if (paymentMethod) {
                state.data.payment.value = Number(paymentValue)
                paymentMethod.value = Number(paymentValue)
            }
            updateAllTotals(state, paymentValue)
        },
        changePaymentValue: (state, actions) => {
            const paymentValue = actions.payload
            state.data.payment.value = Number(paymentValue)
        },
        addTaxReceiptInState: (state, actions) => {
            state.data.NCF = actions.payload
        },
        addPaymentMethod: (state, actions) => {
            const data = actions.payload
            state.data.paymentMethod = data
        },
        changeProductPrice: (state, action) => {
            const { id, newPrice } = action.payload;
            const product = state.data.products.find((product) => product.id === id);
            if (product) {
                product.pricing.price = newPrice;
            }
            updateAllTotals(state)
        },
        changePaymentMethod: (state) => {
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

            if (checkingID && !checkingID?.weightDetail?.isSoldByWeight) {
                checkingID.amountToBuy = checkingID.amountToBuy + 1;
            } else if (checkingID && checkingID?.weightDetail?.isSoldByWeight) {
                const product = action.payload
                const productData = {
                    ...product,
                    cid: nanoid(8)
                }
                const products = state.data.products
                state.data.products = [...products, productData]

            } else {
                const product = action.payload
                const productData = {
                    ...product,
                    cid: checkingID?.weightDetail?.isSoldByWeight
                        ? nanoid(8)
                        : product.id,
                }
                const products = state.data.products

                state.data.products = [...products, productData]
            }
            updateAllTotals(state)
        },
        deleteProduct: (state, action) => {
            const productFound = state.data.products.find((product) => product.cid === action.payload)
            if (productFound) {
                state.data.products.splice(state.data.products.indexOf(productFound), 1)
            }
            if (state.data.products.length === 0) {
                state.data.id = null
                state.data.products = []
            }
            updateAllTotals(state)
        },
        onChangeValueAmountToProduct: (state, action) => {
            const { id, value } = action.payload
            const productFound = state.data.products.find(product => product.id === id)
            if (productFound) {
                productFound.amountToBuy = Number(value)
            }
            updateAllTotals(state)
        },
        addAmountToProduct: (state, action) => {
            const { id } = action.payload
            const productFound = state.data.products.find((product) => product.id === id)
            if (productFound) {
                productFound.amountToBuy = productFound.amountToBuy + 1;
            }
            updateAllTotals(state)
        },
        diminishAmountToProduct: (state, action) => {
            const { id } = action.payload
            const productFound = state.data.products.find((product) => product.id === id)
            if (productFound) {
                productFound.amountToBuy -= 1;

                if (productFound.amountToBuy === 0) {
                    state.data.products.splice(state.data.products.indexOf(productFound), 1)
                }
            }
            updateAllTotals(state)
        },
        CancelShipping: (state) => state = initialState,
        totalPurchaseWithoutTaxes: (state) => {
            const ProductsSelected = state.data.products;
            const result = ProductsSelected.reduce((total, product) => total + product.cost.total, 0);
            state.data.totalPurchaseWithoutTaxes.value = limitTwoDecimal(result);
        },
        addDiscount: (state, action) => {
            const value = action.payload;
            state.data.discount.value = Number(value);
            updateAllTotals(state)
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
    changeProductPrice,
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
export const SelectCartData = (state) => state.cart.data

export default cartSlice.reducer







