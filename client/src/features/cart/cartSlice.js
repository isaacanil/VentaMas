import { createSlice } from "@reduxjs/toolkit";
import { initialState, defaultDelivery } from "./default/default";
import { GenericClient } from "../clientCart/clientCartSlice";
import { getProductsPrice, getProductsTax, getProductsTotalPrice, getTax, getTotalItems } from "../../utils/pricing";
import { nanoid } from "nanoid";

const limitTwoDecimal = (number) => {
    return Number(number.toFixed(2))
}

const calculateChange = (payment, totalPurchase) => (payment - totalPurchase);

// Función agrupadora para actualizar todos los totales
const updateAllTotals = (state, paymentValue = null) => {
    const taxReceiptEnabled = state.settings.taxReceipt.enabled;
    const products = state.data.products;
    const discount = state?.data?.discount?.value;
    const delivery = state?.data?.delivery?.value;
    state.data.totalPurchase.value = getProductsTotalPrice(products, discount, delivery, taxReceiptEnabled);
    state.data.totalTaxes.value = getProductsTax(products, taxReceiptEnabled);
    state.data.totalShoppingItems.value = getTotalItems(products);
    state.data.totalPurchaseWithoutTaxes.value = getProductsPrice(products);
    const cashPaymentMethod = state.data.paymentMethod
        .findIndex((method) => method.method === 'cash' && method.status === true);

    if (cashPaymentMethod !== -1) {
        state.data.paymentMethod[cashPaymentMethod].value = state.data.totalPurchase.value;
    }

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
        setTaxReceiptEnabled: (state, actions) => {
            const taxReceiptEnabled = actions.payload
            state.settings.taxReceipt.enabled = taxReceiptEnabled
        },
        toggleInvoicePanelOpen: (state) => {
            state.settings.isInvoicePanelOpen = !state.settings.isInvoicePanelOpen
        },
        setCartId: (state) => {
            const id = state.data.id
            if (!id) {
                state.data.id = nanoid()
            }
        },
        addPaymentMethod: (state, actions) => {
            const data = actions.payload
            state.data.paymentMethod = data
        },
        setPaymentMethod: (state, actions) => {
            const paymentMethod = actions.payload
            const index = state.data.paymentMethod.findIndex((method) => method.method === paymentMethod.method);
            if (index !== -1) {
                state.data.paymentMethod[index] = paymentMethod;
            }
            const paymentMethods = state.data.paymentMethod;
            const getActivePaymentMethods = () => paymentMethods
                .filter((method) => method.status === true)
                .reduce((acc, method) => acc + method.value, 0);

            state.data.payment.value = getActivePaymentMethods();
            const setChange = calculateChange(state.data.payment.value, state.data.totalPurchase.value);
            state.data.change.value = setChange;
        },
        toggleReceivableStatus: (state, actions) => {
            const value = actions.payload
            if (value === undefined) {
                state.data.isAddedToReceivables = !state.data.isAddedToReceivables;
            } else {
                state.data.isAddedToReceivables = value;
            }
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
            const products = state.data.products
            //los productos tienen informacion de garantia en product.warranty.status, grarardar en data.warranty un objeto con el id y el fecha en l;a que se agrego
            if (checkingID && !checkingID?.weightDetail?.isSoldByWeight) {
                checkingID.amountToBuy = checkingID.amountToBuy + 1;
            } else if (checkingID && checkingID?.weightDetail?.isSoldByWeight) {
                const product = action.payload
                const productData = {
                    ...product,
                    cid: nanoid(8)
                }
                state.data.products = [...products, productData]
            } else {
                const product = action.payload
                const productData = {
                    ...product,
                    cid: checkingID?.weightDetail?.isSoldByWeight
                        ? nanoid(8)
                        : product.id,
                }
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
        changeProductWeight: (state, action) => {
            const { id, weight } = action.payload
            const product = state.data.products.find((product) => product.cid === id)
            if (product) {
                product.weightDetail.weight = weight
            }
            updateAllTotals(state)
        },
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
        togglePrintInvoice: (state) => {
            state.settings.printInvoice = !state.settings.printInvoice
        }
    }
})

export const {
    addAmountToProduct,
    setCartId,
    getClient,
    addPaymentValue,
    addPaymentMethod,
    addDiscount,
    addPaymentMethodAutoValue,
    togglePrintWarranty,
    addProduct,
    addSourceOfPurchase,
    addTaxReceiptInState,
    CancelShipping,
    changeProductPrice,
    changeProductWeight,
    deleteProduct,
    setPaymentMethod,
    toggleReceivableStatus,
    diminishAmountToProduct,
    onChangeValueAmountToProduct,
    selectClientInState,
    setChange,
    toggleInvoicePanelOpen,
    totalPurchase,
    totalPurchaseWithoutTaxes,
    totalShoppingItems,
    setTaxReceiptEnabled,
    totalTaxes,
    updateClientInState,
    saveBillInFirebase,
    toggleCart,
    togglePrintInvoice
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
export const SelectSettingCart = (state) => state.cart.settings
export const selectCart = (state) => state.cart

export default cartSlice.reducer