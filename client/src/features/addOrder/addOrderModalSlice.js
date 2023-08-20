import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
const EmptyOrder = {
  condition: "",
  dates: {
    createdAt: "",
    deletedAt: "",
    completedAt: "",
    deliveryDate: "",
  },
  note: "",
  id: "",
  orderId: "",
  provider: {},
  replenishments: [],
  state: {},
  receiptImgUrl: "",
  total: 0,
}
const EmptyProductSelected = {
  productName: "",
  id: "",
  cost: 0,
  initialCost: '',
  stock: '',
  newStock: '',
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
      const product = actions.payload.product;
      state.productSelected.stock = product.stock;
      state.productSelected.newStock = 0;
      state.productSelected.initialCost = 0;
      state.productSelected.id = product.id;
      state.productSelected.cost = product.cost.unit;
      state.productSelected.productName = product.productName;
    },
    DeleteProduct: (state, actions) => {
      const { id } = actions.payload
      const productSelected = state.order.replenishments.filter((item) => item.id === id)
      const index = state.order.replenishments.indexOf(productSelected)
      state.order.replenishments.splice(index, 1)
      //total Precio del pedido
      const productList = state.order.replenishments;
      const totalPurchase = productList.reduce((total, item) => total + (item.initialCost * item.newStock), 0)
      state.order.total = totalPurchase
    },
    AddProductToOrder: (state) => {
      state.order.replenishments.push(state.productSelected)
      state.productSelected = EmptyProductSelected;
      const productList = state.order.replenishments;
      const total = productList.reduce((total, item) => total + (item.initialCost * item.newStock), 0)
      state.order.total = total;
    },
    setProductSelected: (state, actions) => {
      const newValue = actions.payload
      state.productSelected = { ...state.productSelected, ...newValue }
    },
    getInitialCost: (state, actions) => {
      const { initialCost } = actions.payload
      state.productSelected.initialCost = initialCost
    },
    addNewStock: (state, actions) => {
      const { stock } = actions.payload
      state.productSelected.stock = stock;

    },
    updateProduct: (state, actions) => {
      const { value, productID } = actions.payload;
      const index = state.order.replenishments.findIndex((item) => item.id === productID);
      if (index !== -1) {
        state.order.replenishments[index] = {
          ...state.order.replenishments[index],
          ...value,
        };
      }
    },
    updateInitialCost: (state, actions) => {
      const { initialCost, productID } = actions.payload
      const product = state.order.replenishments.find(({ product }) => product.id === productID);
      if (product !== undefined) {
        product.initialCost = initialCost;
      }
    },
    AddNote: (state, actions) => {
      state.order.note = actions.payload
    },
    AddCondition: (state, actions) => {
      state.order.condition = actions.payload
    },
    AddDate: (state, actions) => {
      state.order.dates.deliveryDate = actions.payload
    },
    AddCreatedDate: (state) => {
      state.order.dates.createdAt = Date.now()
    },
    AddIdToOrder: (state) => {
      state.order.orderId = nanoid(6)
    },
    cleanOrder: (state) => {
      state.productSelected = EmptyProductSelected
      state.order = EmptyOrder
    },
    AddProvider: (state, actions) => {
      const provider = actions.payload
      if (provider !== null) {
        state.order.provider = provider
      }
    },
  }
})
export const {
  SelectProduct,
  AddProductToOrder,
  getInitialCost,
  updateProduct,
  updateInitialCost,
  AddNote,
  AddCondition,
  AddCreatedDate,
  AddDate,
  AddIdToOrder,
  cleanOrder,
  AddProvider,
  addNewStock,
  setProductSelected,
  DeleteProduct
} = addOrderSlice.actions

export const SelectProductSelected = state => state.addOrder.productSelected;
export const SelectProducts = state => state.addOrder.order.replenishments;
export const SelectOrder = state => state.addOrder.order;
export const SelectTotalPurchase = state => state.addOrder.order.total;

export default addOrderSlice.reducer