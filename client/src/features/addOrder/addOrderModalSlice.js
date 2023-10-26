import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { OPERATION_MODES } from "../../constants/modes";
const EmptyOrder = {
  condition: "",
  dates: {
    createdAt: "",
    deletedAt: "",
    completedAt: "",
    deliveryDate: "",
    paymentDate: "",
  },
  note: "",
  numberId: "",
  id: "",
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
  mode: OPERATION_MODES.CREATE.id,
  productSelected: EmptyProductSelected,
  order: EmptyOrder
}
const addOrderSlice = createSlice({
  name: 'addOrder',
  initialState,
  reducers: {
    getOrderData: (state, actions) => {
      const { data, mode = OPERATION_MODES.CREATE.id } = actions.payload;
      state.mode = mode;
      data ? state.order = data : null;
    },
    SelectProduct: (state, actions) => {
      const product = actions.payload.product;
      state.productSelected = { ...state.productSelected, ...product }
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
        state.order.total = state.order.replenishments.reduce((total, item) => total + (item.initialCost * item.newStock), 0);
      }
    },
    updateInitialCost: (state, actions) => {
      const { initialCost, productID } = actions.payload
      const product = state.order.replenishments.find(({ product }) => product.id === productID);
      if (product !== undefined) {
        product.initialCost = initialCost;
      }
    },
    setOrder: (state, actions) => {
      state.order = { ...state.order, ...actions.payload }
    },
 
    cleanOrder: (state) => {
      state.productSelected = EmptyProductSelected
      state.order = EmptyOrder
      state.mode = OPERATION_MODES.CREATE.id
    },

  }
})
export const {
  setOrder,
  cleanOrder,
  addNewStock,
  getOrderData,
  SelectProduct,
  updateProduct,
  DeleteProduct,
  getInitialCost,
  AddProductToOrder,
  updateInitialCost,
  setProductSelected,
} = addOrderSlice.actions

export const SelectProductSelected = state => state.addOrder.productSelected;
export const SelectProducts = state => state.addOrder.order.replenishments;
export const SelectOrder = state => state.addOrder.order;
export const SelectOrderState = state => state.addOrder;
export const SelectTotalPurchase = state => state.addOrder.order.total;

export default addOrderSlice.reducer