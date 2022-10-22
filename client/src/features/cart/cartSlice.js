import { createSlice } from "@reduxjs/toolkit";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { separator } from "../../hooks/separator";
import { Product } from "../../views";
import { v4 } from "uuid";
import { nanoid } from "nanoid";
const initialState = {
    id: null,
    client: null,
    products: [],
    delivery: {
        status: false,
        value: 0
    },
    cashPaymentMethod: {
        status: false,
        value: 0
    },
    cardPaymentMethod: {
        status: false,
        value: 0
    },
    transferPaymentMethod: {
        status: false,
        value: 0
    },
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
const cartSlice = createSlice({
    name: 'factura',
    initialState,
    reducers: {
        getId: (state) => {
          
            state.id = nanoid(8)
        },
        addClient: (state, action) => {
            state.client = action.payload
            //console.log(action.payload)
        },
        addDelivery: (state, action) => {
            state.delivery.value = action.payload

        },
        addCashPaymentMethod: (state, action) => {
            state.cashPaymentMethod = action.payload
        },
        addCardPaymentMethod: (state, action) => {
            state.cardPaymentMethod = action.payload
        },
        addTransferPaymentMethod: (state, action) => {
            state.transferPaymentMethod = action.payload
        },
        addProduct: (state, action) => {
            
            //state.products.push(action.payload)
            
            const checkingID = state.products.find((product) => product.id === action.payload.id)
            if (state.products.length > 0 && checkingID) {
                console.log(checkingID.amountToBuy.total)
                checkingID.amountToBuy.total = checkingID.amountToBuy.total + checkingID.amountToBuy.unit;
                checkingID.price.total = checkingID.price.unit * checkingID.amountToBuy.total;
                checkingID.tax.total = checkingID.tax.unit * checkingID.amountToBuy.total;
            } else {
                state.products.push(action.payload)
                console.log('ejecutando')
                console.log(action.payload)
            }
        },
        deleteProduct: (state, action) => {
            const productFound = state.products.find((product) => product.id === action.payload)
            if (productFound) {
                state.products.splice(state.products.indexOf(productFound), 1)

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
            }

        },
        addAmountToProduct: (state, action) => {
            const { value, id } = action.payload

           
            const productFound = state.products.find((product) => product.id === id)
          
            if (productFound) {
                productFound.amountToBuy.total = productFound.amountToBuy.total + productFound.amountToBuy.unit
                productFound.price.total = productFound.amountToBuy.total * productFound.price.unit;
                productFound.tax.total = productFound.amountToBuy.total * productFound.tax.unit + productFound.tax.unit;
                productFound.cost.total = productFound.amountToBuy.total * productFound.cost.unit + productFound.cost.unit;
            }

               
            


        },
        diminishAmountToProduct: (state, action) => {
            const { id } = action.payload
            const productFound = state.products.find((product) => product.id === id)
            //console.log(productFound)

            if (productFound) {
                productFound.amountToBuy.total = productFound.amountToBuy.total - productFound.amountToBuy.unit
                productFound.price.total = productFound.amountToBuy.total * productFound.price.unit ;

                productFound.amountToBuy.total == 0 ? state.products.splice(state.products.indexOf(productFound), 1) : null
            }
        },
        CancelShipping: (state) => {
           
            state.id = ""
            state.client = null
            state.products = []
            state.change.value = 0
            state.delivery = {
                status: false,
                value: 0
            }
            state.cashPaymentMethod = {
                status: false,
                value: 0
            }
            state.cardPaymentMethod = {
                status: false,
                value: 0
            }
            state.transferPaymentMethod = {
                status: false,
                value: 0
            }
            state.totalShoppingItems = {
                value: 0
            }
            state.totalPurchaseWithoutTaxes = {
                value: 0
            }
            state.totalTaxes = {
                value: 0
            }
            state.totalPurchase = {
                value: 0
            }
        },
        totalTaxes: (state) => {
            const productSelected = state.products
            const total = productSelected.reduce((total, product) => total + product.tax.total, 0)
            state.totalTaxes.value = total
        },
        setChange: (state) => {
            const totalPurchase = state.totalPurchase.value;
            const cashPaymentMethod = Number(state.cashPaymentMethod.value);
            const cardPaymentMethod = Number(state.cardPaymentMethod.value);
            const transferPaymentMethod = Number(state.transferPaymentMethod.value);
            const change = (cashPaymentMethod + cardPaymentMethod + transferPaymentMethod) - totalPurchase;
            if (state.cashPaymentMethod.status === true) {
                state.change.value = change
            }
            if (state.cashPaymentMethod.status === false) {
                state.change.value = 0
            }
        },
        totalPurchaseWithoutTaxes: (state) => {
            const ProductsSelected = state.products;
            const result = ProductsSelected.reduce((total, product) => total + product.cost.total, 0);
            state.totalPurchaseWithoutTaxes.value = result;

        },
        totalPurchase: (state) => {
            const productSelected = state.products
            const total = productSelected.reduce((total, product) => total + product.price.total, 0)
           // const totalTaxes = state.totalTaxes.value;
           // const ProductsCost = state.products.reduce((total, product) => total + product.cost.total, 0)
            const Delivery = state.delivery.value;
            state.totalPurchase.value = ( Number(Delivery) + Number(total))
        },
        totalShoppingItems: (state) => {
            const Items = state.products.reduce((total, product) => total + product.amountToBuy.total, 0) 
            state.totalShoppingItems.value = Items
        }
    }

})

export const {
    getId,
    addClient,
    addProduct,
    addDelivery,
    addCashPaymentMethod,
    addCardPaymentMethod,
    addTransferPaymentMethod,
    deleteProduct,
    onChangeValueAmountToProduct,
    addAmountToProduct,
    diminishAmountToProduct,
    CancelShipping,
    totalPurchaseWithoutTaxes,
    totalTaxes,
    totalShoppingItems,
    totalPurchase,
    setChange

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

export const TotalProductWithoutTaxes = () => {
    const productSelected = useSelector((state) => state.cart.products)
    const total = productSelected.reduce((total, product) => total + product.cost, 0)
    return total
}


export const CashPaymentMethodRef = () => {
    const productSelect = useSelector((state) => state.cart.cashPaymentMethod.value)
    return productSelect
}






