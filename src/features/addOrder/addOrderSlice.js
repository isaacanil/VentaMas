import { createSlice } from '@reduxjs/toolkit';
// Add missing import
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';

import {
  getDefaultTransactionCondition,
  getDefaultTransactionStatus,
} from '@/constants/orderAndPurchaseState';

// Agregar funciones auxiliares para cálculos (idénticas a las de addPurchaseSlice)
const calculateUnitCost = (product) => {
  const baseCost = Number(product.baseCost) || 0;
  const tax = (baseCost * (Number(product.taxPercentage) || 0)) / 100;
  const freight = Number(product.freight) || 0;
  const otherCosts = Number(product.otherCosts) || 0;
  return baseCost + tax + freight + otherCosts;
};

const calculateSubTotal = (product) => {
  const quantity = Number(product.purchaseQuantity || product.quantity) || 0;
  const unitCost = calculateUnitCost(product);
  return quantity * unitCost;
};

const EmptyOrder = {
  condition: getDefaultTransactionCondition()?.id,
  numberId: '',
  id: '',
  createdAt: '',
  deletedAt: '',
  completedAt: '',
  deliveryAt: DateTime.now().toISO(),
  paymentAt: '',
  note: '',
  provider: null,
  replenishments: [],
  status: getDefaultTransactionStatus().id,
  attachmentUrls: [],
  receiptImgUrl: '',
  total: 0,
};

// Actualizar EmptyProductSelected para incluir propiedades usadas en la lógica de backorders y cálculos
const EmptyProductSelected = {
  id: '',
  name: '',
  quantity: 0,
  purchaseQuantity: 0, // Cantidad total a comprar
  selectedBackOrders: [], // Solo contendrá {id, quantity}
  unitMeasurement: '', // agregado
  baseCost: 0, // agregado
  unitCost: 0, // agregado
  subtotal: 0, // agregado
};

const initialState = {
  productSelected: EmptyProductSelected,
  order: EmptyOrder,
};
const addOrderSlice = createSlice({
  name: 'addOrder',
  initialState,
  reducers: {
    getOrderData: (state, actions) => {
      const data = actions.payload;
      state.order = data ? data : null;
    },
    setProductSelected: (state, actions) => {
      const newValue = actions.payload;
      state.productSelected = { ...state.productSelected, ...newValue };
    },
    SelectProduct: (state, actions) => {
      const product = actions.payload;
      let productData = {
        key: nanoid(),
        id: product.id,
        name: product.name,
        expirationDate: product.expirationDate ?? null, // Use null for empty date
        quantity: product.quantity ?? 1,
        purchaseQuantity: product.purchaseQuantity ?? (product.quantity ?? 1), // Use existing purchaseQuantity or default to quantity, then 1
        selectedBackOrders: [], // BackOrders seleccionados
        unitMeasurement: product.unitMeasurement ?? '',
        baseCost: product.pricing?.cost ?? product.baseCost ?? 0, // Use pricing cost, then product baseCost, then 0
        taxPercentage: product.taxPercentage ?? 0,
        freight: product.freight ?? 0,
        otherCosts: product.otherCosts ?? 0,
        unitCost: 0,
        subtotal: 0,
      };
      
      productData.unitCost = calculateUnitCost(productData);
      productData.subtotal = calculateSubTotal(productData);
      
      state.productSelected = productData;
    },
    AddProductToOrder: (state) => {
      state.order.replenishments.push(state.productSelected);
      state.productSelected = EmptyProductSelected; // Fix reference
    },
    setOrder: (state, actions) => {
      const { ...rest } = actions.payload;

      state.order = {
        ...state.order,
        ...rest,
      };
    },
    getInitialCost: (state, actions) => {
      const { initialCost } = actions.payload;
      state.productSelected.initialCost = initialCost;
    },
    cleanOrder: (state) => {
      state.productSelected = EmptyProductSelected; // Fix reference
      state.order = EmptyOrder;
      state.mode = 'add';
    },
    updateProduct: (state, action) => {
      const { value } = action.payload;
      const productIndex = state.order.replenishments.findIndex((item) => {
        const matchesKey = value?.key && item.key === value.key;
        const matchesId = value?.id && item.id === value.id;
        const matchesOriginalId =
          value?.originalId && item.id === value.originalId;
        return matchesKey || matchesId || matchesOriginalId;
      });
      if (productIndex === -1) return;
      const currentProduct = state.order.replenishments[productIndex];
      const selectedBackOrders =
        value.selectedBackOrders !== undefined
          ? value.selectedBackOrders
          : currentProduct.selectedBackOrders || [];
      const totalBackordersQuantity = selectedBackOrders.reduce(
        (sum, order) => sum + order.quantity,
        0,
      );
      const purchaseQuantity =
        value.purchaseQuantity !== undefined
          ? value.purchaseQuantity
          : value.quantity !== undefined
            ? value.quantity + totalBackordersQuantity
            : currentProduct.purchaseQuantity;
      const quantity =
        value.quantity !== undefined
          ? value.quantity
          : Math.max(0, purchaseQuantity - totalBackordersQuantity);
      const updatedProduct = {
        ...currentProduct,
        ...value,
        purchaseQuantity,
        quantity,
        selectedBackOrders,
      };
      state.order.replenishments[productIndex] = {
        ...updatedProduct,
        unitCost: calculateUnitCost(updatedProduct),
        subtotal: calculateSubTotal(updatedProduct),
      };
    },
    addAttachmentToOrder: (state, actions) => {
      state.order.attachmentUrls = [
        ...state.order.attachmentUrls,
        actions.payload,
      ];
    },

    clearProductSelected: (state) => {
      state.productSelected = EmptyProductSelected;
    },
    deleteReceiptImageFromOrder: (state) => {
      state.order.receiptUrl = '';
    },
    deleteProductFromOrder: (state, actions) => {
      const { id, key } = actions.payload;
      state.order.replenishments = state.order.replenishments.filter(
        (item) => {
          const matchesKey = key && item.key === key;
          const matchesId = id && item.id === id;
          return !(matchesKey || matchesId);
        },
      );
    },
    setSelectedBackOrders: (state, action) => {
      const { selectedBackOrders, purchaseQuantity } = action.payload;
      const totalBackordersQuantity = selectedBackOrders.reduce(
        (sum, order) => sum + order.quantity,
        0,
      );

      state.productSelected = {
        ...state.productSelected,
        selectedBackOrders, // Solo contiene {id, quantity}
        purchaseQuantity,
        quantity: Math.max(0, purchaseQuantity - totalBackordersQuantity),
      };
    },
    setPurchaseQuantity: (state, action) => {
      const quantity = action.payload;
      const totalBackordersQuantity =
        state.productSelected.selectedBackOrders.reduce(
          (sum, order) => sum + order.quantity,
          0,
        );

      state.productSelected = {
        ...state.productSelected,
        purchaseQuantity: quantity,
        quantity: Math.max(0, quantity - totalBackordersQuantity),
      };
    },
    clearSelectedBackOrders: (state) => {
      state.productSelected = {
        ...state.productSelected,
        selectedBackOrders: [],
        purchaseQuantity: state.productSelected.quantity,
        quantity: state.productSelected.quantity,
      };
    },
  },
});

export const {
  setOrder,
  cleanOrder,
  getOrderData,
  SelectProduct,
  updateProduct,
  deleteProductFromOrder,
  deleteReceiptImageFromOrder,
  clearProductSelected,
  getInitialCost,
  AddProductToOrder,
  setProductSelected,
  setSelectedBackOrders,
  setPurchaseQuantity,
  clearSelectedBackOrders,
} = addOrderSlice.actions;

export const selectProductSelected = (state) => state.addOrder.productSelected;
export const selectProducts = (state) => state.addOrder.order.replenishments;
export const selectOrder = (state) => state.addOrder.order;
export const selectOrderState = (state) => state.addOrder;
export const selectTotalOrder = (state) => state.addOrder.order.total;

export default addOrderSlice.reducer;
