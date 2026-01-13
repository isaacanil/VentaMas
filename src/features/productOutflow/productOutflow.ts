import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

import { OPERATION_MODES } from '@/constants/modes';

const EmptyProductsOutflow = [];

const EmptyProduct = {
  id: null, // Identificador Ãºnico del producto
  product: null, // Identificador del producto especÃ­fico que se vende
  motive: '', //Identificador de la razÃ³n detrÃ¡s de la salida del producto
  quantityRemoved: 0,
  observations: '', // Cualquier comentario adicional o notas relacionadas con el producto
  status: false, // El estado de la salida del producto (si se ha completado o no)
};
const EmptyProductOutflow = {
  productList: EmptyProductsOutflow, // Lista de productos que se venden
};
const initialState = {
  mode: OPERATION_MODES.CREATE.label,
  productSelected: EmptyProduct,
  data: {
    productList: EmptyProductsOutflow,
  },
};

export const productOutflowSlice = createSlice({
  name: 'productOutflow',
  initialState,
  reducers: {
    selectProduct: (state: any, actions: PayloadAction<any>) => {
      const newData = actions.payload;
      state.productSelected = {
        ...(state.productSelected || {}),
        ...(newData || {}),
        id: state.productSelected?.id || nanoid(10),
      };
    },
    addProductToProductOutflow: (state: any, actions: PayloadAction<any>) => {
      let data = actions.payload;
      data = {
        ...data,
      };
      state.data.productList = [...state.data.productList, data];
      state.productSelected = EmptyProduct;
    },
    updateProductFromProductOutflow: (state: any, action: PayloadAction<any>) => {
      const { id, data } = action.payload;
      const updatedProductList = state.data.productList.map((product) => {
        if (product.id === id) {
          return { ...product, ...data };
        }
        return product;
      });
      state.data.productList = updatedProductList;
    },
    deleteProductFromProductOutflow: (state: any, actions: PayloadAction<any>) => {
      const { id } = actions.payload;
      const checkingId = state.data.productList.filter(
        (item) => item.id !== id,
      );
      if (checkingId) {
        state.data.productList = checkingId;
      }
    },
    setProductOutflowData: (state: any, actions: PayloadAction<any>) => {
      const { data } = actions.payload;

      return {
        ...state,
        productSelected: data.productSelected,
        data: {
          ...state.data,
          ...data.data,
        },
        mode: data.mode,
      };
    },
    deleteData: (state: any) => {
      state.mode = OPERATION_MODES.CREATE.label;
      state.productSelected = EmptyProduct;
      state.data = EmptyProductOutflow;
    },
  },
});

export const {
  selectProduct,
  addProductToProductOutflow,
  deleteProductFromProductOutflow,
  deleteData,
  updateProductFromProductOutflow,
  setProductOutflowData,
} = productOutflowSlice.actions;

//selectors
export const SelectProductOutflow = (state) => state.productOutflow;
export const SelectProductSelected = (state) =>
  state.productOutflow.productSelected;
export const SelectProductList = (state) =>
  state.productOutflow.data.productList;

export default productOutflowSlice.reducer;


