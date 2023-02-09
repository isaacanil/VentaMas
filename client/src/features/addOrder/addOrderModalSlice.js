import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
const EmptyOrder = {
  id: "",
  products: [],
  totalPurchase: 0.00,
  condition: "",
  date: "",
  note: "",
  createdAt: "",
  updatedAt: "",
  state: {
  },
  provider: {
    providerId: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    createdAt: "",
    updatedAt: "",

  }
}
const EmptyProductSelected =  {
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
}
const initialState = {
  productSelected: EmptyProductSelected,
  order: EmptyOrder
}
const addOrderSlice = createSlice({
  name: 'addOrder',
  initialState,
  reducers: {
    SelectProduct: (state, actions) => {
      state.productSelected = actions.payload
      console.log(state.productSelected)
      //const purchase = state.order.products.reduce((item)=>)
    },
    AddProduct: (state) => {
      state.order.products.push(state.productSelected)
      console.log(state.order.products)
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

      //total Precio del pedido
      const productList = state.order.products
      const totalPurchase = productList.reduce((total, item) => total + (item.product.price.unit * item.product.stock.newStock), 0)
      state.order.totalPurchase = totalPurchase
    },
    updateStock: (state, actions) => {
      const {stock } = actions.payload
      state.productSelected.product.stock = stock
    },
    AddNote: (state, actions) => {
      state.order.note = actions.payload
    },
    AddCondition: (state, actions) => {
      state.order.condition = actions.payload
    },
    AddDate: (state, actions) => {
      state.order.date = actions.payload
    },
    AddCreatedDate: (state) => {
      state.order.createdAt = Date.now()
    },
    AddIdToOrder: (state) => {
      state.order.id = nanoid(6)
    },
    cleanOrder: (state) => {
      state.productSelected = EmptyProductSelected
      state.order = EmptyOrder
    },
    AddProvider: (state, actions) => {
      state.order.provider = actions.payload
    },
   

  }
})
export const {
  SelectProduct,
  AddProduct,
  AddNote,
  AddCondition,
  AddCreatedDate,
  AddDate,
  AddIdToOrder,
  cleanOrder,
  AddProvider,
  updateStock
} = addOrderSlice.actions

export const SelectProductSelected = state => state.addOrder.productSelected;
export const SelectProducts = state => state.addOrder.order.products;
export const SelectOrder = state => state.addOrder.order;
export const SelectTotalPurchase = state => state.addOrder.order.totalPurchase;

export default addOrderSlice.reducer