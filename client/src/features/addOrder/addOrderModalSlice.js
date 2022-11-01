import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    productSelected: {
      product: {
        productName: "",
        cost: {
          unit: 0
        },
        stock: 0,
        price: {
          unit: 0
        },

      }
    },
    products: [],
}
const addOrderSlice = createSlice({
    name: 'addOrder',
    initialState,
    reducers: {
      SelectProduct: (state, actions) => {
        state.productSelected = actions.payload
        console.log(state.productSelected)
      },
      AddProduct: (state) => {
        state.products.push(state.productSelected)
        console.log(state.products)
        state.productSelected = {
          product: {
            productName: undefined,
            cost: {
              unit: 0
            },
            stock: 0,
            price: {
              unit: 0
            },
    
          }
        }
      }

    }
})
export const { 
  SelectProduct,
  AddProduct
} = addOrderSlice.actions

export const SelectProductSelected = state => state.addOrder.productSelected
export const SelectProducts = state => state.addOrder.products

export default addOrderSlice.reducer