import { createSlice } from "@reduxjs/toolkit";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { separator } from "../../hooks/separator";
import { Product } from "../../views";
import { v4 } from "uuid";
const initialState = {
    id: v4(),
    date: {     
    },
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
        getDate: (state) => {
            // const now = new Date()
            // const day = now.getDate()
            // const year = now.getFullYear()
            // const month = now.getMonth()
            // state.date.readWay = day + month + year;
            // state.date.timeStamp = new Date();
            state.date = new Date()
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
            if (state.length === 0) {
                state.products.push(action.payload)
            }
            const checkingID = state.products.find((product) => product.id === action.payload.id)
            if (state.products.length > 0 && checkingID) {
                console.log('listo')
                if (checkingID) {
                    checkingID.amountToBuy;
                    checkingID.price.total = checkingID.price.unit * checkingID.amountToBuy;
                    checkingID.tax.total = checkingID.tax.unit * checkingID.amountToBuy;
                }


            } else {
                state.products.push(action.payload)
            }
        },
        deleteProduct: (state, action) => {
            const productFound = state.products.find((product) => product.id === action.payload)
            if (productFound) {
                state.products.splice(state.products.indexOf(productFound), 1)
              
            }

        },
        onChangeValueAmountToProduct: (state, action) => {
            const {id, value} = action.payload
           
            
          
            const productFound = state.products.find(product => product.id === id)
            if(productFound){
                productFound.amountToBuy = Number(value)
             
                console.log(Number(value))
              
                productFound.price.total = Number(productFound.amountToBuy) * productFound.price.unit;
                productFound.tax.total = productFound.amountToBuy * productFound.tax.unit;
                productFound.cost.total = productFound.amountToBuy * productFound.cost.unit;
            }
            
        },   
        addAmountToProduct: (state, action) => {
            const {value, id} = action.payload
            
            Number(value)
            const productFound = state.products.find((product) => product.id === id)
            //console.log(productFound)  
                
            if (productFound) {
                productFound.amountToBuy = Number(value)
                productFound.price.total = productFound.amountToBuy * productFound.price.unit + productFound.price.unit;
                productFound.tax.total = productFound.amountToBuy * productFound.tax.unit + productFound.tax.unit;
                productFound.cost.total = productFound.amountToBuy * productFound.cost.unit + productFound.cost.unit;
            }
         
           
        },
        diminishAmountToProduct: (state, action) => {
            const {id, value} = action.payload
            const productFound = state.products.find((product) => product.id === id)
            //console.log(productFound)
            
            if (productFound) {
                productFound.amountToBuy = Number(value)
                productFound.price.total  = productFound.amountToBuy * productFound.price.unit - productFound.price.unit;
                
                value => 1 ? state.products.splice(state.products.indexOf(productFound), 1) : null
            }
        },
        CancelShipping: (state) => {
            state.client = null
            state.products = []
            state.change.value = 0
            state.delivery = {
                status: false,
                value: 0
            }
        }, 
        totalTaxes: (state) => {
            const productSelected =  state.products
            const total = productSelected.reduce((total, product) => total + product.tax.total, 0)
            state.totalTaxes.value = total
        },  
        setChange: (state) => {
            const totalPurchase = state.totalPurchase.value;
            const cashPaymentMethod = Number(state.cashPaymentMethod.value);
            const cardPaymentMethod = Number(state.cardPaymentMethod.value);
            const transferPaymentMethod = Number(state.transferPaymentMethod.value);
            const change = (cashPaymentMethod + cardPaymentMethod + transferPaymentMethod) - totalPurchase;
            if(state.cashPaymentMethod.status === true){
                state.change.value = change
            }
            if(state.cashPaymentMethod.status === false){
                state.change.value = 0
            }
        },
        totalPurchaseWithoutTaxes: (state) => {
            const ProductsSelected = state.products;
            const result = ProductsSelected.reduce((total, product) => total + product.cost.total, 0);
            state.totalPurchaseWithoutTaxes.value = result;

        },   
        totalPurchase: (state) => {
            const totalTaxes = state.totalTaxes.value;
            const Delivery = state.delivery.value;
            const ProductsCost = state.products.reduce((total, product) => total + product.cost.total, 0)
            state.totalPurchase.value = (totalTaxes + Number(Delivery) + ProductsCost)
        }
    }

})

export const {
    getDate,
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
export const SelectChange = (state) => state.cart.change.value;

export default cartSlice.reducer

export const TotalProductWithoutTaxes = () => {
    const productSelected = useSelector((state) => state.cart.products)
    const total = productSelected.reduce((total, product) => total + product.cost, 0)
    return total
}
// export const TotalTaxes = () => {
//     const productSelected = useSelector((state) => state.cart.products)
//     const total = productSelected.reduce((total, product) => total + product.taxes, 0)
//     return total.toFixed(2)
// } 

export const CashPaymentMethodRef = () => {
    const productSelect = useSelector((state) => state.cart.cashPaymentMethod.value)
    return productSelect
}



    
    
